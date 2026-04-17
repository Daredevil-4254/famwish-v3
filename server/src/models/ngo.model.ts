import { Schema, model, Document } from 'mongoose';

export interface INgo extends Document {
  name: string;
  registrationId: string;
  razorpayAccountId: string;
  contactEmail: string;
  has80G: boolean;
  eightyGRegistrationNumber?: string;
  authorizedSignatoryName?: string;
  digitalStampImageUrl?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NgoSchema = new Schema<INgo>({
  name: { type: String, required: true, trim: true },
  registrationId: { type: String, required: true, unique: true, trim: true },
  razorpayAccountId: { type: String, required: true, unique: true },
  contactEmail: { type: String, required: true, trim: true, lowercase: true },
  has80G: { type: Boolean, default: false },
  eightyGRegistrationNumber: { type: String, trim: true },
  authorizedSignatoryName: { type: String, trim: true },
  digitalStampImageUrl: { type: String },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

export const Ngo = model<INgo>('Ngo', NgoSchema);