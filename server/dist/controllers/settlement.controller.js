"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSettlement = exports.settleAuction = void 0;
const settlement_service_1 = require("../services/settlement.service");
const settlement_model_1 = require("../models/settlement.model");
/**
 * POST /api/auctions/:id/settle
 *
 * Admin-only action. Triggers fund disbursement via Razorpay Routes.
 *
 * Body:
 *   - finalPaymentId: string  — Razorpay pay_xxxx from winner's final payment
 *   - settledBy: string       — Admin's userId (eventually from JWT)
 */
const settleAuction = async (req, res) => {
    try {
        const { id: auctionId } = req.params;
        const { finalPaymentId, settledBy } = req.body;
        if (!finalPaymentId || !settledBy) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields: finalPaymentId, settledBy.',
            });
            return;
        }
        const result = await (0, settlement_service_1.executeSettlement)({ auctionId, finalPaymentId, settledBy });
        const statusCode = result.success ? 200 : 400;
        res.status(statusCode).json(result);
    }
    catch (error) {
        console.error('Settlement Controller Error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during settlement.',
        });
    }
};
exports.settleAuction = settleAuction;
/**
 * GET /api/auctions/:id/settlement
 *
 * Returns the settlement audit record for a given auction.
 * Safe to expose to admins and potentially to the winning bidder.
 */
const getSettlement = async (req, res) => {
    try {
        const { id: auctionId } = req.params;
        const settlement = await settlement_model_1.Settlement.findOne({ auctionItem: auctionId })
            .populate('winner', 'firstName lastName email')
            .populate('auctionItem', 'title highestBid');
        if (!settlement) {
            res.status(404).json({ message: 'No settlement record found for this auction.' });
            return;
        }
        res.status(200).json(settlement);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch settlement.', error: error.message });
    }
};
exports.getSettlement = getSettlement;
