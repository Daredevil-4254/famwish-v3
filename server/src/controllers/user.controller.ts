import { Request, Response } from 'express';
import { User } from '../models/user.model';

// Get user profile by clerk ID
export const getUserByClerkId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clerkId } = req.params;
    const user = await User.findOne({ clerkId });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json(user);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error while fetching profile.', error: error.message });
  }
};

// Get user profile
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    res.status(200).json(user);
  } catch (error: any) {
    // Catches errors like an invalid ObjectId format
    if (error.name === 'CastError') {
        res.status(400).json({ message: `Invalid user ID format: ${req.params.userId}` });
        return;
    }
    res.status(500).json({ message: 'Server error while fetching profile.', error: error.message });
  }
};

// Update Tax Profile
export const updateTaxProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const taxData = req.body;

    const user = await User.findById(userId);
    
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
  } catch (error: any) {
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

// Create User (Helper for testing)
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error: any) {
    // MongoDB Duplicate Key Error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      res.status(409).json({ // 409 Conflict is more appropriate
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

// Update User Role (For Admin & Approval Flow)
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clerkId } = req.params;
    const { role } = req.body;
    
    if (!['BIDDER', 'ADMIN', 'CELEBRITY', 'PENDING_CELEBRITY'].includes(role)) {
      res.status(400).json({ message: 'Invalid role' });
      return;
    }

    const updated = await User.findOneAndUpdate({ clerkId }, { role }, { new: true });
    if (!updated) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update user role', error: error.message });
  }
};

// Get pending celebrities for the Admin Queue
export const getPendingCelebrities = async (req: Request, res: Response): Promise<void> => {
  try {
    const pending = await User.find({ role: 'PENDING_CELEBRITY' });
    res.status(200).json(pending);
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error while fetching pending celebs', error: error.message });
  }
};