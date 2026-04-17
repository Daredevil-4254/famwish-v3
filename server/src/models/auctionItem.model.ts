import { Schema, model, Document, Types } from 'mongoose';

export interface IPayoutConfig {
  recipient: 'NGO' | 'CELEBRITY' | 'PLATFORM';
  accountId: string; // Razorpay Account ID
  percentage: number;
}

export interface IDigitalTwin {
  metadataHash: string;
  platformSignature: string;
  signedAt: Date;
}

export interface IAuctionItem extends Document {
  title: string;
  description: string;
  images: string[];
  celebrity: Types.ObjectId; // Ref to User (CELEBRITY)
  ngo: Types.ObjectId; // Ref to Ngo
  startPrice: number;
  minBidIncrement: number;
  startTime: Date;
  endTime: Date;
  autoExtendWindow: number; // minutes
  status: 'DRAFT' | 'UPCOMING' | 'LIVE' | 'SOLD' | 'UNSOLD' | 'PAUSED' | 'SETTLED';
  emdPercentage: number;
  highestBid: number;
  winner?: Types.ObjectId;
  payoutConfigs: IPayoutConfig[];
  digitalTwin?: IDigitalTwin;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutConfigSchema = new Schema<IPayoutConfig>({
  recipient: { type: String, enum: ['NGO', 'CELEBRITY', 'PLATFORM'], required: true },
  accountId: { type: String, required: true },
  percentage: { type: Number, required: true, min: 0, max: 100 },
}, { _id: false });

const DigitalTwinSchema = new Schema<IDigitalTwin>({
  metadataHash: { type: String, required: true },
  platformSignature: { type: String, required: true },
  signedAt: { type: Date, default: Date.now },
}, { _id: false });

const AuctionItemSchema = new Schema<IAuctionItem>({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  images: [{ type: String, required: true }],
  celebrity: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ngo: { type: Schema.Types.ObjectId, ref: 'Ngo', required: true }, // Add Ngo model later
  startPrice: { type: Number, required: true, min: 0 },
  minBidIncrement: { type: Number, required: true, min: 1 },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  autoExtendWindow: { type: Number, default: 2 },
  status: { type: String, enum: ['DRAFT', 'UPCOMING', 'LIVE', 'SOLD', 'UNSOLD', 'PAUSED', 'SETTLED'], default: 'DRAFT' },
  emdPercentage: { type: Number, required: true, min: 5, max: 25 },
  highestBid: { type: Number, default: 0 },
  winner: { type: Schema.Types.ObjectId, ref: 'User' },
  payoutConfigs: [PayoutConfigSchema],
  digitalTwin: DigitalTwinSchema,
}, { timestamps: true });

AuctionItemSchema.index({ status: 1, endTime: 1 });

AuctionItemSchema.pre('save', function () {
  if (this.payoutConfigs && this.payoutConfigs.length > 0) {
    const total = this.payoutConfigs.reduce((sum, config) => sum + config.percentage, 0);
    if (total !== 100) {
      throw new Error('Financial Compliance Error: Total payout percentages must equal exactly 100%');
    }
  }
});

export const AuctionItem = model<IAuctionItem>('AuctionItem', AuctionItemSchema);