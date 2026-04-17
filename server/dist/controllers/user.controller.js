"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = exports.updateTaxProfile = exports.getUserProfile = exports.getUserByClerkId = void 0;
const user_model_1 = require("../models/user.model");
// Get user profile by clerk ID
const getUserByClerkId = async (req, res) => {
    try {
        const { clerkId } = req.params;
        const user = await user_model_1.User.findOne({ clerkId });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error while fetching profile.', error: error.message });
    }
};
exports.getUserByClerkId = getUserByClerkId;
// Get user profile
const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await user_model_1.User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json(user);
    }
    catch (error) {
        // Catches errors like an invalid ObjectId format
        if (error.name === 'CastError') {
            res.status(400).json({ message: `Invalid user ID format: ${req.params.userId}` });
            return;
        }
        res.status(500).json({ message: 'Server error while fetching profile.', error: error.message });
    }
};
exports.getUserProfile = getUserProfile;
// Update Tax Profile
const updateTaxProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const taxData = req.body;
        const user = await user_model_1.User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        user.taxProfile = { ...user.taxProfile, ...taxData };
        await user.save(); // This triggers the pre-save hook to check completeness
        res.status(200).json({
            message: 'Tax profile updated successfully',
            taxProfile: user.taxProfile
        });
    }
    catch (error) {
        if (error.name === 'CastError') {
            res.status(400).json({ message: `Invalid user ID format: ${req.params.userId}` });
            return;
        }
        if (error.name === 'ValidationError') {
            res.status(400).json({ message: 'Tax profile update failed: Invalid data provided.', details: error.message });
            return;
        }
        res.status(500).json({ message: 'Server error while updating tax profile.', error: error.message });
    }
};
exports.updateTaxProfile = updateTaxProfile;
// Create User (Helper for testing)
const createUser = async (req, res) => {
    try {
        const newUser = new user_model_1.User(req.body);
        await newUser.save();
        res.status(201).json(newUser);
    }
    catch (error) {
        // MongoDB Duplicate Key Error
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            res.status(409).json({
                message: `User creation failed: A user with this ${field} already exists.`,
                field: field,
            });
            return;
        }
        // Mongoose Validation Error
        if (error.name === 'ValidationError') {
            res.status(400).json({ message: 'User creation failed: Invalid data provided.', details: error.message });
            return;
        }
        res.status(500).json({ message: 'Failed to create user due to a server error.', error: error.message });
    }
};
exports.createUser = createUser;
