"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auction_controller_1 = require("../controllers/auction.controller");
const settlement_controller_1 = require("../controllers/settlement.controller");
const receipt_controller_1 = require("../controllers/receipt.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post('/', auction_controller_1.createAuction); // Admin: create auction
router.get('/', auction_controller_1.getAllLiveAuctions); // Public: listing page
router.get('/debug/winners', auction_controller_1.debugWonAuctionCandidates); // Debug: inspect dashboard winner matches
router.get('/won/:userId', auction_controller_1.getWonAuctionsByUser); // Dashboard: auctions won by a user
router.get('/:id', auction_controller_1.getAuctionById); // Public: detail page
// Settlement — Admin only (auth middleware to be added pre-launch)
router.post('/:id/settle', auth_middleware_1.requireClerkAuth, settlement_controller_1.settleAuction); // Trigger fund disbursement
router.get('/:id/settlement', auth_middleware_1.requireClerkAuth, settlement_controller_1.getSettlement); // Audit: view settlement record
// Receipt Generation — Can be open or auth-guarded
router.get('/:id/receipt', auth_middleware_1.requireClerkAuth, receipt_controller_1.downloadReceipt);
exports.default = router;
