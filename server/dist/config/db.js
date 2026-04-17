"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI;
        if (!mongoURI) {
            console.error('FATAL ERROR: MONGO_URI is not defined in .env file.');
            process.exit(1);
        }
        const conn = await mongoose_1.default.connect(mongoURI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`❌ MongoDB Connection Error: ${error.message}`);
        }
        else {
            console.error('An unknown error occurred during MongoDB connection.');
        }
        process.exit(1);
    }
};
exports.default = connectDB;
