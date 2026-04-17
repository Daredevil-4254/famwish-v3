"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bid = void 0;
const mongoose_1 = require("mongoose");
const BidSchema = new mongoose_1.Schema({
    auctionItem: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AuctionItem', required: true, index: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
});
exports.Bid = (0, mongoose_1.model)('Bid', BidSchema);
