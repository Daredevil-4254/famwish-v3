import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuctionItem } from '../models/auctionItem.model';
import { User } from '../models/user.model';
import { Ngo } from '../models/ngo.model';

export const createAuction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { celebrity, ngo, ...auctionData } = req.body;

    // Validate that the referenced User and NGO exist
    const celebrityExists = await User.findById(celebrity);
    const ngoExists = await Ngo.findById(ngo);

    if (!celebrityExists || !ngoExists) {
      res.status(404).json({ message: 'Referenced celebrity or NGO not found.' });
      return;
    }

    // Prevent creating an auction for an unverified NGO with 80G
    if (ngoExists.has80G && !ngoExists.isVerified) {
      res.status(400).json({ message: 'Cannot create 80G auction for an unverified NGO.' });
      return;
    }

    const newAuction = new AuctionItem({ ...auctionData, celebrity, ngo });
    await newAuction.save(); // This will trigger our 100% payout validation

    res.status(201).json(newAuction);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to create auction', error: error.message });
  }
};

export const getAllLiveAuctions = async (req: Request, res: Response): Promise<void> => {
  try {
    const auctions = await AuctionItem.find({ status: 'LIVE' })
      .populate('celebrity', 'firstName lastName profileImageUrl')
      .populate('ngo', 'name has80G');
    res.status(200).json(auctions);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch auctions', error: error.message });
  }
};

export const getWonAuctionsByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params as { userId: string };

    const localUser = await User.findOne({ clerkId: userId });
    if (!localUser) {
      res.status(200).json([]);
      return;
    }

    const auctions = await AuctionItem.find({
      winner: localUser._id,
      status: { $in: ['SOLD', 'SETTLED'] },
    })
      .sort({ endTime: -1 })
      .populate('celebrity', 'firstName lastName profileImageUrl')
      .populate('ngo', 'name digitalStampImageUrl has80G');

    res.status(200).json(auctions);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch won auctions', error: error.message });
  }
};

export const debugWonAuctionCandidates = async (_req: Request, res: Response): Promise<void> => {
  try {
    const auctions = await AuctionItem.find({
      status: { $in: ['SOLD', 'SETTLED'] },
    })
      .sort({ endTime: -1 })
      .populate('winner', 'firstName lastName email clerkId')
      .select('title status highestBid endTime winner');

    const result = auctions.map((auction) => {
      const winner =
        auction.winner && typeof auction.winner === 'object' && 'id' in auction.winner
          ? auction.winner
          : null;

      return {
        auctionId: auction._id,
        title: auction.title,
        status: auction.status,
        highestBid: auction.highestBid,
        endTime: auction.endTime,
        winnerId: winner?.id ?? null,
        winner: winner
          ? {
              firstName: (winner as any).firstName,
              lastName: (winner as any).lastName,
              email: (winner as any).email,
              clerkId: (winner as any).clerkId,
            }
          : null,
      };
    });

    res.status(200).json({
      mockDashboardUserId: '661e58f2732e4979a32353f5',
      total: result.length,
      auctions: result,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to inspect won auction candidates', error: error.message });
  }
};

export const getAuctionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const auction = await AuctionItem.findById(req.params.id)
      .populate('celebrity', 'firstName lastName profileImageUrl')
      .populate('ngo', 'name digitalStampImageUrl has80G');
    if (!auction) {
      res.status(404).json({ message: 'Auction not found' });
      return;
    }
    res.status(200).json(auction);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch auction', error: error.message });
  }
};

export const getDraftAuctions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const drafts = await AuctionItem.find({ status: 'DRAFT' })
      .populate('celebrity', 'firstName lastName')
      .populate('ngo', 'name has80G');
    res.status(200).json(drafts);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch drafts', error: error.message });
  }
};

export const updateAuctionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // In a real app, Admin auth middleware guards this route
    const updated = await AuctionItem.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) {
      res.status(404).json({ message: 'Auction not found' });
      return;
    }
    
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update auction status', error: error.message });
  }
};

export const placeBid = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { bidAmount, bidderClerkId } = req.body;
    
    const auction = await AuctionItem.findById(id);
    if (!auction) { res.status(404).json({ message: 'Auction not found' }); return; }
    if (auction.status !== 'LIVE') { res.status(400).json({ message: 'Auction is not live' }); return; }
    
    const currentHighest = auction.highestBid > 0 ? auction.highestBid : auction.startPrice;
    if (bidAmount <= currentHighest) { res.status(400).json({ message: 'Bid must be higher than current highest bid' }); return; }

    const user = await User.findOne({ clerkId: bidderClerkId });
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }

    auction.highestBid = bidAmount;
    auction.winner = user._id; // Temporary assignment as highest bidder
    await auction.save();
    
    res.status(200).json({ message: 'Bid placed successfully', currentBid: bidAmount });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to place bid', error: error.message });
  }
};

export const updateAuctionTime = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { hoursToAdd } = req.body;
    
    if (typeof hoursToAdd !== 'number') {
      res.status(400).json({ message: 'hoursToAdd must be a number' });
      return;
    }

    const auction = await AuctionItem.findById(id);
    if (!auction) { res.status(404).json({ message: 'Auction not found' }); return; }

    const currentEndTime = new Date(auction.endTime);
    currentEndTime.setHours(currentEndTime.getHours() + hoursToAdd);
    
    auction.endTime = currentEndTime;
    await auction.save();
    
    res.status(200).json({ message: 'Time successfully manipulated', endTime: auction.endTime });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error manipulating time', error: error.message });
  }
};
