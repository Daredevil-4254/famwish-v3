import { Schema, model, Document, Types } from 'mongoose';

/**
 * A single payout leg within a settlement.
 * Each leg maps to one Razorpay Route transfer.
 */
export interface ISettlementTransfer {
  recipient: 'NGO' | 'CELEBRITY' | 'PLATFORM';
  razorpayAccountId: string;
  percentage: number;
  amount: number; // Computed: (highestBid * percentage / 100), in INR
  razorpayTransferId: string; // Returned by Razorpay after transfer is created
  status: 'SUCCESS' | 'FAILED';
  failureReason?: string;
}

/**
 * Immutable audit record created when an auction is settled.
 * Once created, this document is the source of truth for fund movement.
 */
export interface ISettlement extends Document {
  auctionItem: Types.ObjectId;
  winner: Types.ObjectId;
  totalAmount: number;         // The final winning bid amount, in INR
  finalPaymentId: string;      // Razorpay payment_id from winner's final payment
  transfers: ISettlementTransfer[];
  settledAt: Date;
  settledBy: string;           // Admin userId who triggered the settlement
  status: 'COMPLETED' | 'PARTIAL_FAILURE'; // PARTIAL_FAILURE if any leg failed
  createdAt: Date;
}

const SettlementTransferSchema = new Schema<ISettlementTransfer>({
  recipient: { type: String, enum: ['NGO', 'CELEBRITY', 'PLATFORM'], required: true },
  razorpayAccountId: { type: String, required: true },
  percentage: { type: Number, required: true },
  amount: { type: Number, required: true },
  razorpayTransferId: { type: String, default: '' },
  status: { type: String, enum: ['SUCCESS', 'FAILED'], required: true },
  failureReason: { type: String },
}, { _id: false });

const SettlementSchema = new Schema<ISettlement>({
  auctionItem: { type: Schema.Types.ObjectId, ref: 'AuctionItem', required: true, unique: true },
  winner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  totalAmount: { type: Number, required: true },
  finalPaymentId: { type: String, required: true },
  transfers: [SettlementTransferSchema],
  settledAt: { type: Date, default: Date.now },
  settledBy: { type: String, required: true },
  status: { type: String, enum: ['COMPLETED', 'PARTIAL_FAILURE'], required: true },
}, { timestamps: true });

export const Settlement = model<ISettlement>('Settlement', SettlementSchema);
