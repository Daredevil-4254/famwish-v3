"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadReceipt = void 0;
const receipt_service_1 = require("../services/receipt.service");
/**
 * GET /api/auctions/:id/receipt
 *
 * Fetches and generates an 80G receipt if applicable for the settled auction.
 * Streams the PDF directly to the client.
 */
const downloadReceipt = async (req, res) => {
    try {
        const { id: auctionId } = req.params;
        // Defer the business logic and PDF streaming to the service
        await (0, receipt_service_1.generate80GReceipt)(auctionId, res);
    }
    catch (error) {
        console.error('Receipt Generation Error:', error);
        if (!res.headersSent) {
            res.status(400).json({
                success: false,
                message: error.message || 'Error generating receipt',
            });
        }
    }
};
exports.downloadReceipt = downloadReceipt;
