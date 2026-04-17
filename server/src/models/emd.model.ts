import { Schema, model, Document, Types } from 'mongoose';

export interface IEmd extends Document {
  user: Types.ObjectId;
  auctionItem: Types.ObjectId;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'REFUNDED';
  createdAt: Date;
  updatedAt: Date;
}

const EmdSchema = new Schema<IEmd>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  auctionItem: { type: Schema.Types.ObjectId, ref: 'AuctionItem', required: true },
  razorpayOrderId: { type: String, required: true, unique: true },
  razorpayPaymentId: { type: String },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'PAID', 'REFUNDED'], default: 'PENDING' },
}, { timestamps: true });

// A user can only have one EMD record per auction
EmdSchema.index({ user: 1, auctionItem: 1 }, { unique: true });

export const Emd = model<IEmd>('Emd', EmdSchema);