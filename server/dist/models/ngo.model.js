"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ngo = void 0;
const mongoose_1 = require("mongoose");
const NgoSchema = new mongoose_1.Schema({
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
exports.Ngo = (0, mongoose_1.model)('Ngo', NgoSchema);
