"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./config/db"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const auction_routes_1 = __importDefault(require("./routes/auction.routes"));
const ngo_routes_1 = __importDefault(require("./routes/ngo.routes"));
const emd_routes_1 = __importDefault(require("./routes/emd.routes"));
const auth_middleware_1 = require("./middlewares/auth.middleware");
const biddingEngine_service_1 = require("./services/biddingEngine.service");
const backend_1 = require("@clerk/backend");
dotenv_1.default.config();
(0, db_1.default)();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express_1.default.json());
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
    }
});
// --- API Routes ---
// Apply Clerk middleware globally so it populates req.auth
app.use(auth_middleware_1.attachClerkAuth);
app.use('/api/users', user_routes_1.default);
app.use('/api/auctions', auction_routes_1.default);
app.use('/api/ngos', ngo_routes_1.default);
app.use('/api/emd', emd_routes_1.default);
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'FamWish v3 server is running.' });
});
io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);
    // Client joins a specific auction's real-time update room
    socket.on('join:auction_room', (auctionId) => {
        socket.join(auctionId);
        console.log(`Client ${socket.id} joined room for auction ${auctionId}`);
    });
    // Client leaves an auction's room
    socket.on('leave:auction_room', (auctionId) => {
        socket.leave(auctionId);
        console.log(`Client ${socket.id} left room for auction ${auctionId}`);
    });
    // Handle an incoming bid
    socket.on('place:bid', async (data) => {
        const { auctionId, userId, bidAmount, clerkToken } = data;
        // Auth Check
        if (!clerkToken) {
            return socket.emit('bid:error', { auctionId, message: 'Unauthorized. Missing authentication token.' });
        }
        try {
            await (0, backend_1.verifyToken)(clerkToken, { secretKey: process.env.CLERK_SECRET_KEY });
        }
        catch {
            return socket.emit('bid:error', { auctionId, message: 'Unauthorized. Invalid authentication token.' });
        }
        // Call our robust, locked bidding service
        const result = await (0, biddingEngine_service_1.placeBid)(auctionId, userId, bidAmount);
        if (result.success) {
            // Broadcast the successful bid to everyone in that auction's room
            io.to(auctionId).emit('bid:update', {
                auctionId,
                newHighestBid: result.newHighestBid,
                newEndTime: result.newEndTime,
            });
        }
        else {
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
