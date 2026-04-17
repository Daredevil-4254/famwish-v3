import express, { Express, Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import userRoutes from './routes/user.routes';
import auctionRoutes from './routes/auction.routes';
import ngoRoutes from './routes/ngo.routes';
import emdRoutes from './routes/emd.routes';
import { attachClerkAuth } from './middlewares/auth.middleware';
import { placeBid } from './services/biddingEngine.service';
import { verifyToken } from '@clerk/backend';

dotenv.config();
connectDB();

const app: Express = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));
app.use(express.json());

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  }
});

// --- API Routes ---
// Apply Clerk middleware globally so it populates req.auth
app.use(attachClerkAuth);

app.use('/api/users', userRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/ngos', ngoRoutes);
app.use('/api/emd', emdRoutes);

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', message: 'FamWish v3 server is running.' });
});

io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  // Client joins a specific auction's real-time update room
  socket.on('join:auction_room', (auctionId: string) => {
    socket.join(auctionId);
    console.log(`Client ${socket.id} joined room for auction ${auctionId}`);
  });

  // Client leaves an auction's room
  socket.on('leave:auction_room', (auctionId: string) => {
    socket.leave(auctionId);
    console.log(`Client ${socket.id} left room for auction ${auctionId}`);
  });

  // Handle an incoming bid
  socket.on('place:bid', async (data: { auctionId: string; userId: string; bidAmount: number; clerkToken?: string }) => {
    const { auctionId, userId, bidAmount, clerkToken } = data;
    
    // Auth Check
    if (!clerkToken) {
      return socket.emit('bid:error', { auctionId, message: 'Unauthorized. Missing authentication token.' });
    }
    try {
      await verifyToken(clerkToken, { secretKey: process.env.CLERK_SECRET_KEY });
    } catch {
      return socket.emit('bid:error', { auctionId, message: 'Unauthorized. Invalid authentication token.' });
    }

    // Call our robust, locked bidding service
    const result = await placeBid(auctionId, userId, bidAmount);

    if (result.success) {
      // Broadcast the successful bid to everyone in that auction's room
      io.to(auctionId).emit('bid:update', {
        auctionId,
        newHighestBid: result.newHighestBid,
        newEndTime: result.newEndTime,
      });
    } else {
      // Send an error message back to only the user who made the bid
      socket.emit('bid:error', { auctionId, message: result.message });
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server is ready and listening.`);
});
