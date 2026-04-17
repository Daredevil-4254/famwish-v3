import { Schema, model, Document, Types } from 'mongoose';

export interface IBid extends Document {
  auctionItem: Types.ObjectId;
  user: Types.ObjectId;
  amount: number;
  timestamp: Date;
}

const BidSchema = new Schema<IBid>({
  auctionItem: { type: Schema.Types.ObjectId, ref: 'AuctionItem', required: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

export const Bid = model<IBid>('Bid', BidSchema);