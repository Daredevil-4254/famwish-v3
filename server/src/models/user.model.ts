import { Schema, model, Document } from 'mongoose';

// Interface for the embedded Tax Profile
export interface ITaxProfile {
  panNumber: string;
  fullName: string; // As per PAN card
  fullAddress: string; // Required for 80G
  city: string;
  state: string;
  pincode: string;
  isComplete: boolean;
}

// Interface for the main User document
export interface IUser extends Document {
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  role: 'BIDDER' | 'ADMIN' | 'CELEBRITY' | 'PENDING_CELEBRITY';
  taxProfile: ITaxProfile;
  createdAt: Date;
  updatedAt: Date;
}

const TaxProfileSchema = new Schema<ITaxProfile>({
  panNumber: { type: String, trim: true, default: '' },
  fullName: { type: String, trim: true, default: '' },
  fullAddress: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  state: { type: String, trim: true, default: '' },
  pincode: { type: String, trim: true, default: '' },
  isComplete: { type: Boolean, default: false },
}, { _id: false });

const UserSchema = new Schema<IUser>({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  profileImageUrl: { type: String },
  role: {
    type: String,
    enum: ['BIDDER', 'ADMIN', 'CELEBRITY', 'PENDING_CELEBRITY'],
    default: 'BIDDER',
  },
  taxProfile: {
    type: TaxProfileSchema,
    default: () => ({})
  },
}, { timestamps: true });

// Pre-save hook to check if the tax profile is complete
UserSchema.pre('save', function () {
  if (this.isModified('taxProfile')) {
    const { panNumber, fullName, fullAddress, city, state, pincode } = this.taxProfile;
    this.taxProfile.isComplete = !!(panNumber && fullName && fullAddress && city && state && pincode);
  }
});

export const User = model<IUser>('User', UserSchema);