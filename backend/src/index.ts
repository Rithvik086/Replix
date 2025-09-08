import express, { Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/database";
import authRoutes from "./routes/auth";
import messagesRoutes from "./routes/messages";
import settingsRoutes from "./routes/settings";
import Message from './models/Message';
import { initWhatsApp, getQrCode, getStatus, setSocketIO, sendManualMessage } from "./whatsapp";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middlewares
app.use(cors({
    origin: [
        "http://localhost:3000",
        "http://localhost:5173",
        process.env.FRONTEND_URL || ""
    ].filter(url => url && url.length > 0),
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/auth", authRoutes);
app.use("/messages", messagesRoutes);
app.use("/settings", settingsRoutes);

// Health check
app.get("/", (_req: Request, res: Response) => {
    res.send("🚀 WhatsApp Bot Backend is running!");
});

// Get QR code (as base64)
app.get("/qr", (_req: Request, res: Response) => {
    const qr = getQrCode();
    if (qr) {
        res.json({ qr });
    } else {
        res.status(404).json({ error: "QR not generated yet" });
    }
});

// Get WhatsApp connection status
app.get("/status", (_req: Request, res: Response) => {
    res.json({ status: getStatus() });
});

// Send manual message
app.post("/send-message", async (req: Request, res: Response) => {
    try {
        const { to, message } = req.body;
        
        if (!to || !message) {
            res.status(400).json({ success: false, message: "Missing 'to' or 'message' field" });
            return;
        }

        const result = await sendManualMessage(to, message);
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || "Failed to send message" });
    }
});

// Start server
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: [
            "http://localhost:3000",
            "http://localhost:5173",
            process.env.FRONTEND_URL || ""
        ].filter(url => url && url.length > 0),
        credentials: true
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
});

// Export io for use in other modules
export { io };

httpServer.listen(PORT, async () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    
    // Set socket.io instance for whatsapp module
    setSocketIO(io);
    
    // ensure indexes for messages
    try {
        const ttlDays = Number(process.env.MESSAGE_TTL_DAYS ?? 30);
        await Message.collection.createIndex({ timestamp: 1 }, { expireAfterSeconds: ttlDays * 24 * 60 * 60 });
        await Message.collection.createIndex({ chatId: 1, timestamp: -1 });
        await Message.collection.createIndex({ direction: 1 });
        console.log(`Indexes created (TTL ${ttlDays} days)`);
    } catch (e) {
        console.error('Failed to create message indexes:', e);
    }

    await initWhatsApp();
});
