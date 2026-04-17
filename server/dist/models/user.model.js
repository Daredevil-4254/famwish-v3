"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const TaxProfileSchema = new mongoose_1.Schema({
    panNumber: { type: String, trim: true, default: '' },
    fullName: { type: String, trim: true, default: '' },
    fullAddress: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    pincode: { type: String, trim: true, default: '' },
    isComplete: { type: Boolean, default: false },
}, { _id: false });
const UserSchema = new mongoose_1.Schema({
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    profileImageUrl: { type: String },
    role: {
        type: String,
        enum: ['BIDDER', 'ADMIN', 'CELEBRITY'],
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
exports.User = (0, mongoose_1.model)('User', UserSchema);
