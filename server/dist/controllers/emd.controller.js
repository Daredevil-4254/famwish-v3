"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkEmdStatus = exports.verifyEmdPayment = exports.createEmdOrder = void 0;
const Razorpay = require('razorpay');
const crypto_1 = __importDefault(require("crypto"));
const emd_model_1 = require("../models/emd.model");
const auctionItem_model_1 = require("../models/auctionItem.model");
// Initialize Razorpay (In production, keys must come from .env)
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock123',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret_456',
});
const createEmdOrder = async (req, res) => {
    try {
        const { userId, auctionId } = req.body;
        // 1. Validate Auction & Calculate EMD Amount
        const auction = await auctionItem_model_1.AuctionItem.findById(auctionId);
        if (!auction) {
            res.status(404).json({ message: 'Auction not found' });
            return;
        }
        const emdAmount = Math.round(auction.startPrice * (auction.emdPercentage / 100));
        // 2. Check if already paid
        let emdRecord = await emd_model_1.Emd.findOne({ user: userId, auctionItem: auctionId });
        if (emdRecord && emdRecord.status === 'PAID') {
            res.status(400).json({ message: 'EMD already paid for this auction' });
            return;
        }
        // 3. Create Razorpay Order
        const options = {
            amount: emdAmount * 100, // Razorpay expects amount in paise
            currency: 'INR',
            receipt: `emd_${auctionId}_${userId}`.substring(0, 40),
        };
        const order = await razorpay.orders.create(options);
        // 4. Save/Update EMD Record
        if (emdRecord) {
            emdRecord.razorpayOrderId = order.id;
            emdRecord.amount = emdAmount;
            emdRecord.status = 'PENDING';
            await emdRecord.save();
        }
        else {
            await emd_model_1.Emd.create({
                user: userId,
                auctionItem: auctionId,
                razorpayOrderId: order.id,
                amount: emdAmount,
            });
        }
        res.status(200).json({ orderId: order.id, amount: emdAmount });
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating EMD order', error: error.message });
    }
};
exports.createEmdOrder = createEmdOrder;
// Endpoint to verify payment signature (called after Razorpay checkout finishes)
// Razorpay signature spec: HMAC-SHA256(order_id + "|" + payment_id, key_secret)
const verifyEmdPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            res.status(400).json({ success: false, message: 'Missing payment fields in request.' });
            return;
        }
        // 1. Reconstruct the expected signature using our secret key
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) {
            console.error('FATAL: RAZORPAY_KEY_SECRET is not set in environment.');
            res.status(500).json({ success: false, message: 'Server configuration error.' });
            return;
        }
        const expectedSignature = crypto_1.default
            .createHmac('sha256', keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');
        // 2. Timing-safe comparison to prevent timing attacks
        const isAuthentic = crypto_1.default.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature));
        if (!isAuthentic) {
            console.warn(`[SECURITY] Invalid Razorpay signature for order: ${razorpay_order_id}`);
            res.status(400).json({ success: false, message: 'Payment verification failed: invalid signature.' });
            return;
        }
        // 3. Signature is valid — find the EMD record and mark it PAID
        const emdRecord = await emd_model_1.Emd.findOne({ razorpayOrderId: razorpay_order_id });
        if (!emdRecord) {
            // Idempotency: if somehow race condition, log and check if already paid
            res.status(404).json({ success: false, message: 'No EMD record found for this order.' });
            return;
        }
        if (emdRecord.status === 'PAID') {
            // Already processed — idempotent success response
            res.status(200).json({ success: true, message: 'EMD already verified and paid.' });
            return;
        }
        // 4. Update the record — store paymentId for the audit trail
        emdRecord.status = 'PAID';
        emdRecord.razorpayPaymentId = razorpay_payment_id;
        await emdRecord.save();
        console.log(`✅ EMD Verified & Paid: orderId=${razorpay_order_id}, paymentId=${razorpay_payment_id}`);
        res.status(200).json({ success: true, message: 'EMD verified. Bidding is now unlocked.' });
    }
    catch (error) {
        console.error('EMD Verification Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error during verification.' });
    }
};
exports.verifyEmdPayment = verifyEmdPayment;
// Check if a specific user has unlocked a specific auction
const checkEmdStatus = async (req, res) => {
    try {
        const { auctionId, userId } = req.params;
        const emdRecord = await emd_model_1.Emd.findOne({ user: userId, auctionItem: auctionId });
        res.status(200).json({
            hasPaid: emdRecord?.status === 'PAID',
            status: emdRecord?.status || 'NONE'
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error checking EMD status', error: error.message });
    }
};
exports.checkEmdStatus = checkEmdStatus;
