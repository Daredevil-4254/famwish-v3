import { Router } from 'express';
import { createAuction, getAllLiveAuctions, getAuctionById, getWonAuctionsByUser, debugWonAuctionCandidates, getDraftAuctions, updateAuctionStatus, placeBid, updateAuctionTime } from '../controllers/auction.controller';
import { settleAuction, getSettlement } from '../controllers/settlement.controller';
import { downloadReceipt } from '../controllers/receipt.controller';
import { requireClerkAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', createAuction);               // Admin: create auction
router.get('/', getAllLiveAuctions);            // Public: listing page
router.get('/debug/winners', debugWonAuctionCandidates); // Debug: inspect dashboard winner matches
router.get('/won/:userId', getWonAuctionsByUser); // Dashboard: auctions won by a user
router.get('/drafts', getDraftAuctions);       // Admin: fetch proposals
router.get('/:id', getAuctionById);            // Public: detail page
router.post('/:id/bid', placeBid);             // Authenticated: submit bid
router.patch('/:id/status', updateAuctionStatus); // Admin: approve draft
router.patch('/:id/time', updateAuctionTime); // Admin: manipulate smart contract timer
// Settlement — Admin only (auth middleware to be added pre-launch)
router.post('/:id/settle', requireClerkAuth, settleAuction);     // Trigger fund disbursement
router.get('/:id/settlement', requireClerkAuth, getSettlement);  // Audit: view settlement record

// Receipt Generation — Can be open or auth-guarded
router.get('/:id/receipt', requireClerkAuth, downloadReceipt);

export default router;
