import { Request, Response } from 'express';
import { Ngo } from '../models/ngo.model';

export const createNgo = async (req: Request, res: Response): Promise<void> => {
  try {
    const newNgo = new Ngo(req.body);
    await newNgo.save();
    res.status(201).json(newNgo);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to create NGO', error: error.message });
  }
};

export const getAllNgos = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Only fetch 80G verified NGOs for the Celebrity Proposal Flow
    const ngos = await Ngo.find({ isVerified: true, has80G: true }).select('name has80G razorpayAccountId');
    res.status(200).json(ngos);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch NGOs', error: error.message });
  }
};