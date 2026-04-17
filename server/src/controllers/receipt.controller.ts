import { Request, Response } from 'express';
import { generate80GReceipt } from '../services/receipt.service';

/**
 * GET /api/auctions/:id/receipt
 * 
 * Fetches and generates an 80G receipt if applicable for the settled auction.
 * Streams the PDF directly to the client.
 */
export const downloadReceipt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: auctionId } = req.params as { id: string };
    
    // Defer the business logic and PDF streaming to the service
    await generate80GReceipt(auctionId, res);

  } catch (error: any) {
    console.error('Receipt Generation Error:', error);
    if (!res.headersSent) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error generating receipt',
      });
    }
  }
};
