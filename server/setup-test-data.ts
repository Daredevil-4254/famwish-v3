import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// We connect to the DB directly for test setup
mongoose.connect(process.env.MONGO_URI as string)
  .then(async () => {
    console.log('Connected to DB');
    
    // Import models after connection
    const { AuctionItem } = await import('./src/models/auctionItem.model');
    const { User } = await import('./src/models/user.model');
    const { Ngo } = await import('./src/models/ngo.model');

    const auctionId = '69df86b29b0d45341857eba2';
    const winnerId = '69df82099b0d45341857eb9f';

    const existingAuction = await AuctionItem.findById(auctionId);
    if (!existingAuction) {
      console.log('Auction not found');
      process.exit(1);
    }

    const ngo = await Ngo.findById(existingAuction.ngo);
    if (ngo) {
      ngo.has80G = true;
      ngo.eightyGRegistrationNumber = '80G-CERT-998877';
      ngo.authorizedSignatoryName = 'Pepper Potts';
      await ngo.save();
      console.log('NGO updated for 80G applicability.');
    }

    const winner = await User.findById(winnerId);
    if (!winner) {
      console.log('Winner user not found, aborting');
      process.exit(1);
    }

    // Set complete tax profile for 80G validation
    winner.taxProfile = {
      panNumber: 'ABCDE1234F',
      fullName: 'Tony Stark',
      fullAddress: '10880 Malibu Point',
      city: 'Malibu',
      state: 'CA',
      pincode: '90265',
      isComplete: true
    };
    await winner.save();
    console.log('Winner tax profile updated.');

    // Pre-condition the auction to be 'SOLD' and have a winner
    const auction = await AuctionItem.findById(auctionId);
    if (auction) {
      auction.status = 'SOLD';
      auction.highestBid = 600000;
      auction.winner = new mongoose.Types.ObjectId(winnerId);
      await auction.save();
      console.log('Auction marked as SOLD with highest bid ₹6,00,000.');
    }

    process.exit(0);
  })
  .catch(err => {
    console.error('DB Error:', err);
    process.exit(1);
  });
