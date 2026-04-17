"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.placeBid = void 0;
const auctionItem_model_1 = require("../models/auctionItem.model");
const bid_model_1 = require("../models/bid.model");
const mongoose_1 = require("mongoose");
// IN-MEMORY LOCK
// Key: AuctionItemId, Value: boolean (true if currently processing a bid)
const auctionLocks = {};
const placeBid = async (auctionId, userId, bidAmount) => {
    // 1. Check Lock (Race Condition Prevention)
    if (auctionLocks[auctionId]) {
        return { success: false, message: 'High traffic: Please try your bid again in a moment.' };
    }
    // 2. Acquire Lock
    auctionLocks[auctionId] = true;
    try {
        // 3. Fetch current auction state
        const auction = await auctionItem_model_1.AuctionItem.findById(auctionId);
        if (!auction)
            throw new Error('Auction not found');
        if (auction.status !== 'LIVE')
            return { success: false, message: 'This auction is not live.' };
        const now = new Date();
        if (now > auction.endTime)
            return { success: false, message: 'This auction has ended.' };
        // 4. Validate Bid Amount
        const currentHighest = auction.highestBid || 0;
        const requiredMinimum = currentHighest === 0 ? auction.startPrice : currentHighest + auction.minBidIncrement;
        if (bidAmount < requiredMinimum) {
            return { success: false, message: `Bid must be at least ₹${requiredMinimum}` };
        }
        // 5. Anti-Sniping (Soft Close)
        // If bid is placed within the autoExtendWindow, extend the endTime
        const timeRemainingMs = auction.endTime.getTime() - now.getTime();
        const autoExtendMs = auction.autoExtendWindow * 60 * 1000;
        let newEndTime = auction.endTime;
        if (timeRemainingMs < autoExtendMs) {
            newEndTime = new Date(now.getTime() + autoExtendMs);
            auction.endTime = newEndTime;
        }
        // 6. Update Auction State
        auction.highestBid = bidAmount;
        auction.winner = new mongoose_1.Types.ObjectId(userId);
        await auction.save();
        // 7. Persist Bid Audit Trail
        await bid_model_1.Bid.create({
            auctionItem: auction._id,
            user: new mongoose_1.Types.ObjectId(userId),
            amount: bidAmount,
            timestamp: now
        });
        return {
            success: true,
            message: 'Bid placed successfully!',
            newHighestBid: bidAmount,
            newEndTime: newEndTime
        };
    }
    catch (error) {
        console.error('Bidding Engine Error:', error);
        return { success: false, message: 'An error occurred while processing your bid.' };
    }
    finally {
        // 8. Release Lock
        auctionLocks[auctionId] = false;
    }
};
exports.placeBid = placeBid;
