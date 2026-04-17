import { Request, Response } from 'express';
import { executeSettlement } from '../services/settlement.service';
import { Settlement } from '../models/settlement.model';

/**
 * POST /api/auctions/:id/settle
 *
 * Admin-only action. Triggers fund disbursement via Razorpay Routes.
 *
 * Body:
 *   - finalPaymentId: string  — Razorpay pay_xxxx from winner's final payment
 *   - settledBy: string       — Admin's userId (eventually from JWT)
 */
export const settleAuction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: auctionId } = req.params as { id: string };
    const { finalPaymentId, settledBy } = req.body;

    if (!finalPaymentId || !settledBy) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: finalPaymentId, settledBy.',
      });
      return;
    }

    const result = await executeSettlement({ auctionId, finalPaymentId, settledBy });

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error: any) {
    console.error('Settlement Controller Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during settlement.',
    });
  }
};

/**
 * GET /api/auctions/:id/settlement
 *
 * Returns the settlement audit record for a given auction.
 * Safe to expose to admins and potentially to the winning bidder.
 */
export const getSettlement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: auctionId } = req.params as { id: string };

    const settlement = await Settlement.findOne({ auctionItem: auctionId })
      .populate('winner', 'firstName lastName email')
      .populate('auctionItem', 'title highestBid');

    if (!settlement) {
      res.status(404).json({ message: 'No settlement record found for this auction.' });
      return;
    }

    res.status(200).json(settlement);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch settlement.', error: error.message });
  }
};
