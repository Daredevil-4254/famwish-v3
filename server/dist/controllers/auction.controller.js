"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuctionById = exports.debugWonAuctionCandidates = exports.getWonAuctionsByUser = exports.getAllLiveAuctions = exports.createAuction = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const auctionItem_model_1 = require("../models/auctionItem.model");
const user_model_1 = require("../models/user.model");
const ngo_model_1 = require("../models/ngo.model");
const createAuction = async (req, res) => {
    try {
        const { celebrity, ngo, ...auctionData } = req.body;
        // Validate that the referenced User and NGO exist
        const celebrityExists = await user_model_1.User.findById(celebrity);
        const ngoExists = await ngo_model_1.Ngo.findById(ngo);
        if (!celebrityExists || !ngoExists) {
            res.status(404).json({ message: 'Referenced celebrity or NGO not found.' });
            return;
        }
        // Prevent creating an auction for an unverified NGO with 80G
        if (ngoExists.has80G && !ngoExists.isVerified) {
            res.status(400).json({ message: 'Cannot create 80G auction for an unverified NGO.' });
            return;
        }
        const newAuction = new auctionItem_model_1.AuctionItem({ ...auctionData, celebrity, ngo });
        await newAuction.save(); // This will trigger our 100% payout validation
        res.status(201).json(newAuction);
    }
    catch (error) {
        res.status(400).json({ message: 'Failed to create auction', error: error.message });
    }
};
exports.createAuction = createAuction;
const getAllLiveAuctions = async (req, res) => {
    try {
        const auctions = await auctionItem_model_1.AuctionItem.find({ status: 'LIVE' })
            .populate('celebrity', 'firstName lastName profileImageUrl')
            .populate('ngo', 'name has80G');
        res.status(200).json(auctions);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch auctions', error: error.message });
    }
};
exports.getAllLiveAuctions = getAllLiveAuctions;
const getWonAuctionsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            res.status(400).json({ message: 'Invalid user id.' });
            return;
        }
        const auctions = await auctionItem_model_1.AuctionItem.find({
            winner: userId,
            status: { $in: ['SOLD', 'SETTLED'] },
        })
            .sort({ endTime: -1 })
            .populate('celebrity', 'firstName lastName profileImageUrl')
            .populate('ngo', 'name digitalStampImageUrl has80G');
        res.status(200).json(auctions);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch won auctions', error: error.message });
    }
};
exports.getWonAuctionsByUser = getWonAuctionsByUser;
const debugWonAuctionCandidates = async (_req, res) => {
    try {
        const auctions = await auctionItem_model_1.AuctionItem.find({
            status: { $in: ['SOLD', 'SETTLED'] },
        })
            .sort({ endTime: -1 })
            .populate('winner', 'firstName lastName email clerkId')
            .select('title status highestBid endTime winner');
        const result = auctions.map((auction) => {
            const winner = auction.winner && typeof auction.winner === 'object' && 'id' in auction.winner
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
                        firstName: winner.firstName,
                        lastName: winner.lastName,
                        email: winner.email,
                        clerkId: winner.clerkId,
                    }
                    : null,
            };
        });
        res.status(200).json({
            mockDashboardUserId: '661e58f2732e4979a32353f5',
            total: result.length,
            auctions: result,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to inspect won auction candidates', error: error.message });
    }
};
exports.debugWonAuctionCandidates = debugWonAuctionCandidates;
const getAuctionById = async (req, res) => {
    try {
        const auction = await auctionItem_model_1.AuctionItem.findById(req.params.id)
            .populate('celebrity', 'firstName lastName profileImageUrl')
            .populate('ngo', 'name digitalStampImageUrl has80G');
        if (!auction) {
            res.status(404).json({ message: 'Auction not found' });
            return;
        }
        res.status(200).json(auction);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch auction', error: error.message });
    }
};
exports.getAuctionById = getAuctionById;
