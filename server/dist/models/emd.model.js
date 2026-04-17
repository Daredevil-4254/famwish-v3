"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Emd = void 0;
const mongoose_1 = require("mongoose");
const EmdSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    auctionItem: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AuctionItem', required: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['PENDING', 'PAID', 'REFUNDED'], default: 'PENDING' },
}, { timestamps: true });
// A user can only have one EMD record per auction
EmdSchema.index({ user: 1, auctionItem: 1 }, { unique: true });
exports.Emd = (0, mongoose_1.model)('Emd', EmdSchema);
