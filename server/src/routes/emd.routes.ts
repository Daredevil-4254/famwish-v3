import { Router } from 'express';
import { createEmdOrder, verifyEmdPayment, checkEmdStatus } from '../controllers/emd.controller';
import { requireClerkAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/create-order', requireClerkAuth, createEmdOrder);
router.post('/verify-payment', requireClerkAuth, verifyEmdPayment);
router.get('/status/:auctionId/:userId', requireClerkAuth, checkEmdStatus);

export default router;