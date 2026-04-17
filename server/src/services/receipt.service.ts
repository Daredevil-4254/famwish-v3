import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { Settlement } from '../models/settlement.model';
import { AuctionItem } from '../models/auctionItem.model';
import { User } from '../models/user.model';
import { Ngo } from '../models/ngo.model';

/**
 * Service to generate an 80G compliant receipt.
 * @param auctionId The ID of the settled auction
 * @param res The Express response stream to pipe the PDF to
 */
export const generate80GReceipt = async (auctionId: string, res: Response): Promise<void> => {
  const settlement = await Settlement.findOne({ auctionItem: auctionId });
  if (!settlement) {
    throw new Error('Settlement not found for this auction');
  }

  const auction = await AuctionItem.findById(auctionId);
  if (!auction) throw new Error('Auction not found');

  const ngo = await Ngo.findById(auction.ngo);
  if (!ngo) throw new Error('NGO not found');

  if (!ngo.has80G || !ngo.eightyGRegistrationNumber) {
    throw new Error('The NGO associated with this auction is not configured for 80G receipts.');
  }

  const winner = await User.findById(settlement.winner);
  if (!winner || !winner.taxProfile?.isComplete) {
    throw new Error('Incomplete winner tax profile. Cannot generate 80G receipt.');
  }

  // Find the exact amount that was transferred to the NGO
  const ngoTransfer = settlement.transfers.find(t => t.recipient === 'NGO');
  if (!ngoTransfer) {
    throw new Error('No NGO transfer found in this settlement.');
  }

  // Configure response for PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=80G_Receipt_${auctionId}_${Date.now()}.pdf`
  );

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  // -- Header --
  doc.fontSize(20).font('Helvetica-Bold').text(ngo.name, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).font('Helvetica');
  doc.text(`Registration No: ${ngo.registrationId}`, { align: 'center' });
  doc.text(`80G Registration No: ${ngo.eightyGRegistrationNumber}`, { align: 'center' });
  doc.text(`Email: ${ngo.contactEmail || 'N/A'}`, { align: 'center' });

  doc.moveDown(2);
  doc.fontSize(16).text('DONATION RECEIPT (80G)', { align: 'center', underline: true });
  doc.moveDown(2);

  // -- Receipt Info --
  doc.fontSize(12);
  doc.text(`Receipt No: FW-80G-${settlement._id.toString().substring(0, 8).toUpperCase()}`);
  doc.text(`Date: ${settlement.settledAt.toLocaleDateString('en-IN')}`);

  doc.moveDown();
  const tax = winner.taxProfile;
  doc.text('Received with thanks from:');
  doc.font('Helvetica-Bold').text(tax.fullName);
  doc.font('Helvetica').text(`${tax.fullAddress}, ${tax.city}, ${tax.state} - ${tax.pincode}`);
  doc.text(`PAN: ${tax.panNumber}`);
  
  doc.moveDown();
  doc.text(`A sum of Rupees (INR): `, { continued: true }).font('Helvetica-Bold').text(`Rs. ${ngoTransfer.amount.toLocaleString('en-IN')}`);
  doc.font('Helvetica').text(`towards the auction of "${auction.title}".`);

  doc.moveDown(2);
  doc.text('This donation is eligible for deduction under section 80G of the Income Tax Act, 1961.');

  doc.moveDown(4);

  // -- Signature / Stamp Info --
  if (ngo.authorizedSignatoryName) {
    doc.text(`For ${ngo.name},`, { align: 'right' });
    doc.moveDown(3);
    doc.text(`(Authorized Signatory)`, { align: 'right' });
    doc.text(ngo.authorizedSignatoryName, { align: 'right' });
  } else {
    doc.text(`For ${ngo.name},`, { align: 'right' });
    doc.moveDown(3);
    doc.text(`(Authorized Signatory)`, { align: 'right' });
  }

  doc.end();
};
