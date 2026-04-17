"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Settlement = void 0;
const mongoose_1 = require("mongoose");
const SettlementTransferSchema = new mongoose_1.Schema({
    recipient: { type: String, enum: ['NGO', 'CELEBRITY', 'PLATFORM'], required: true },
    razorpayAccountId: { type: String, required: true },
    percentage: { type: Number, required: true },
    amount: { type: Number, required: true },
    razorpayTransferId: { type: String, default: '' },
    status: { type: String, enum: ['SUCCESS', 'FAILED'], required: true },
    failureReason: { type: String },
}, { _id: false });
const SettlementSchema = new mongoose_1.Schema({
    auctionItem: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AuctionItem', required: true, unique: true },
    winner: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    totalAmount: { type: Number, required: true },
    finalPaymentId: { type: String, required: true },
    transfers: [SettlementTransferSchema],
    settledAt: { type: Date, default: Date.now },
    settledBy: { type: String, required: true },
    status: { type: String, enum: ['COMPLETED', 'PARTIAL_FAILURE'], required: true },
}, { timestamps: true });
exports.Settlement = (0, mongoose_1.model)('Settlement', SettlementSchema);
