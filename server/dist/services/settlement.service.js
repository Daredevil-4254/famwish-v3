"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeSettlement = void 0;
const mongoose_1 = require("mongoose");
const auctionItem_model_1 = require("../models/auctionItem.model");
const user_model_1 = require("../models/user.model");
const settlement_model_1 = require("../models/settlement.model");
const Razorpay = require('razorpay');
/**
 * Core settlement service.
 *
 * Flow:
 *  1. Validate auction is SOLD and has a winner
 *  2. Validate winner's TaxProfile is complete (required for 80G receipt)
 *  3. Guard: reject if already settled (idempotency)
 *  4. Fire Razorpay Route transfers in parallel, one per payoutConfig leg
 *  5. Persist the Settlement audit record (even on partial failures)
 *  6. Mark AuctionItem status = 'SETTLED'
 */
const executeSettlement = async (input) => {
    const { auctionId, finalPaymentId, settledBy } = input;
    // Lazy-initialize Razorpay so env vars are guaranteed loaded
    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    // ── 1. Fetch & Validate Auction ──────────────────────────────────────────
    const auction = await auctionItem_model_1.AuctionItem.findById(auctionId);
    if (!auction) {
        return { success: false, message: 'Auction not found.' };
    }
    if (auction.status !== 'SOLD') {
        return {
            success: false,
            message: `Cannot settle: auction status is '${auction.status}'. Must be 'SOLD'.`,
        };
    }
    if (!auction.winner) {
        return { success: false, message: 'Cannot settle: no winner recorded for this auction.' };
    }
    if (!auction.payoutConfigs || auction.payoutConfigs.length === 0) {
        return { success: false, message: 'Cannot settle: payoutConfigs are not configured.' };
    }
    if (auction.highestBid <= 0) {
        return { success: false, message: 'Cannot settle: winning bid amount is invalid.' };
    }
    // ── 2. Validate Winner Tax Profile ───────────────────────────────────────
    // 80G receipts require a complete PAN + address on file
    const winner = await user_model_1.User.findById(auction.winner);
    if (!winner) {
        return { success: false, message: 'Winner User record not found.' };
    }
    if (!winner.taxProfile?.isComplete) {
        return {
            success: false,
            message: 'Cannot settle: winner\'s Tax Profile (PAN, address) is incomplete. Required for 80G compliance.',
        };
    }
    // ── 3. Idempotency Guard ─────────────────────────────────────────────────
    const existingSettlement = await settlement_model_1.Settlement.findOne({ auctionItem: new mongoose_1.Types.ObjectId(auctionId) });
    if (existingSettlement) {
        return {
            success: true,
            message: 'Auction already settled (idempotent response).',
            settlementId: existingSettlement._id.toString(),
            status: existingSettlement.status,
            transfers: existingSettlement.transfers,
        };
    }
    // ── 4. Execute Razorpay Route Transfers in Parallel ──────────────────────
    const totalAmount = auction.highestBid; // in INR
    const transferPromises = auction.payoutConfigs.map(async (config) => {
        const legAmount = Math.round(totalAmount * (config.percentage / 100));
        const legAmountPaise = legAmount * 100;
        const transferRecord = {
            recipient: config.recipient,
            razorpayAccountId: config.accountId,
            percentage: config.percentage,
            amount: legAmount,
            razorpayTransferId: '',
            status: 'FAILED',
        };
        try {
            const transfer = await razorpay.transfers.create({
                account: config.accountId,
                amount: legAmountPaise,
                currency: 'INR',
                source: finalPaymentId,
                source_type: 'payment',
                on_hold: false,
                notes: {
                    auctionId: auctionId,
                    recipient: config.recipient,
                    percentage: `${config.percentage}%`,
                    platform: 'FamWish v3',
                },
            });
            transferRecord.razorpayTransferId = transfer.id;
            transferRecord.status = 'SUCCESS';
            console.log(`  ✅ Transfer [${config.recipient}] ₹${legAmount} → ${config.accountId} | ID: ${transfer.id}`);
        }
        catch (err) {
            transferRecord.failureReason = err?.error?.description || err?.message || 'Unknown Razorpay error';
            console.error(`  ❌ Transfer [${config.recipient}] FAILED → ${config.accountId} | Reason: ${transferRecord.failureReason}`);
        }
        return transferRecord;
    });
    console.log(`🏦 Settlement triggered for auction [${auctionId}] | Total: ₹${totalAmount}`);
    const completedTransfers = await Promise.all(transferPromises);
    // ── 5. Determine Overall Status ──────────────────────────────────────────
    const allSucceeded = completedTransfers.every((t) => t.status === 'SUCCESS');
    const overallStatus = allSucceeded
        ? 'COMPLETED'
        : 'PARTIAL_FAILURE';
    // ── 6. Persist Settlement Audit Record ───────────────────────────────────
    // We persist the audit record REGARDLESS of partial failures.
    // This ensures the settlement is always traceable by auditors.
    const settlementDoc = await settlement_model_1.Settlement.create({
        auctionItem: new mongoose_1.Types.ObjectId(auctionId),
        winner: auction.winner,
        totalAmount,
        finalPaymentId,
        transfers: completedTransfers,
        settledAt: new Date(),
        settledBy,
        status: overallStatus,
    });
    // ── 7. Mark Auction as SETTLED ───────────────────────────────────────────
    // Only mark SETTLED if all transfers completed cleanly. 
    // PARTIAL_FAILURE leaves it in SOLD for manual admin review.
    if (allSucceeded) {
        auction.status = 'SETTLED';
        await auction.save();
        console.log(`🎉 Auction [${auctionId}] fully settled.`);
    }
    else {
        console.warn(`⚠️  Auction [${auctionId}] settlement PARTIAL_FAILURE — requires manual review.`);
    }
    return {
        success: true,
        message: allSucceeded
            ? 'Settlement completed. All funds disbursed.'
            : 'Settlement recorded with PARTIAL_FAILURE. Some transfers failed — manual action required.',
        settlementId: settlementDoc._id.toString(),
        status: overallStatus,
        transfers: completedTransfers,
    };
};
exports.executeSettlement = executeSettlement;
