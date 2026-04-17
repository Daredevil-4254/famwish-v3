# FamWish Protocol V3 🚀

An ultra-premium, invite-only philanthropic auction platform designed for high-net-worth individuals. Built with a decoupled MERN+WebSocket architecture.

## 🌟 Key Features
- **Real-Time Bidding Engine:** Powered by Socket.io for sub-millisecond bidirectional market data synchronization. No HTTP polling.
- **Role-Based Governance Matrix:** Three-tier identity system (Bidders, Celebrities, Global Admins) managed by Clerk.
- **The Holy Trinity Admin Hub:** Centralized command center managing The Vault (active smart contracts), The Talent (KYC pipeline), and The Impact (verified NGOs).
- **Temporal Smart Contracts:** Live time manipulation via the Dynamic Time Override Terminal to deter sniping and handle logistics.
- **Razorpay EMD Escrow:** Nodal route-split payment structures guaranteeing 10% Earnest Money Deposits and zero-liability settlement.

## 💻 Tech Stack
- **Frontend:** Next.js 16 (React) with Turbopack, Tailwind CSS, Framer Motion
- **Backend:** Node.js, Express.js, TypeScript
- **Database:** MongoDB (Mongoose)
- **Real-Time Engine:** Socket.io
- **Auth:** Clerk (JWT)

## 🛠️ Local Development Setup

### 1. Backend Server Setup
```bash
cd server
npm install
```
Create a `.env` file in the `/server` directory:
```env
PORT=8080
MONGODB_URI=your_mongodb_connection_string
CLERK_SECRET_KEY=your_clerk_secret_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
FRONTEND_URL=http://localhost:3000
```
Run the server:
```bash
npm run dev
```

### 2. Frontend Client Setup
Open a new terminal:
```bash
cd client
npm install
```
Create a `.env.local` file in the `/client` directory:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
NEXT_PUBLIC_SERVER_URL=http://localhost:8080
```
Run the client:
```bash
npm run dev
```

## 📜 Architecture & Compliance
The platform utilizes a strict 3-Layer Trust Protocol. Money does not route to Celebrities; 100% of final auction settlement capital is routed directly to the verified 80G non-profit via Razorpay Escrow.

---
*Created for academic evaluation and enterprise scaling. Phase 4 will introduce un-alterable blockchain provenance ledgers.*
