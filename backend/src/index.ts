import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/database";
import authRoutes from "./routes/auth";
import messagesRoutes from "./routes/messages";
import settingsRoutes from "./routes/settings";
import rulesRoutes from "./routes/rules";
import Message from './models/Message';
import { initWhatsApp, getQrCode, getStatus, setSocketIO, sendManualMessage, logoutWhatsApp } from "./whatsapp";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middlewares
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
].filter(Boolean);

// Custom CORS handler that ensures preflight responses include the right headers
app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin as string | undefined;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    // include Cookie so browser preflight knows cookies may be used
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie');
    }
    if (req.method === 'OPTIONS') {
        // Always respond to preflight requests
        res.sendStatus(204);
        return;
    }
    next();
});

// Keep express cors middleware for convenience (uses the same allowedOrigins)
app.use(cors({ origin: allowedOrigins, credentials: true, optionsSuccessStatus: 204 }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/auth", authRoutes);
app.use("/messages", messagesRoutes);
app.use("/settings", settingsRoutes);
app.use("/rules", rulesRoutes);

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

// Logout WhatsApp session endpoint
app.post("/whatsapp/logout", async (req: Request, res: Response) => {
    try {
        const result = await logoutWhatsApp();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || "Failed to logout" });
    }
});

// Debug endpoint to inspect WhatsApp auth directory (enable with ENABLE_DEBUG=true)
if (process.env.ENABLE_DEBUG === 'true') {
    app.get('/admin/auth-status', async (_req: Request, res: Response) => {
        try {
            const authPath = process.env.WWEBJS_AUTH_PATH || '.wwebjs_auth';
            const resolved = require('path').resolve(authPath);
            const fs = require('fs');
            let files: any[] = [];
            if (fs.existsSync(resolved)) {
                files = fs.readdirSync(resolved).map((f: string) => {
                    const st = fs.statSync(require('path').join(resolved, f));
                    return { name: f, size: st.size, mtime: st.mtime };
                });
            }
            res.json({ ok: true, authPath: resolved, files, uptime: process.uptime() });
        } catch (e) {
            res.status(500).json({ ok: false, error: String(e) });
        }
    });
}

// Start server
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
    origin: allowedOrigins,
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
    console.log('🔗 Allowed CORS origins:', allowedOrigins);
    if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
        console.warn('⚠️ NODE_ENV=production but FRONTEND_URL is not set — CORS may block your frontend. Set FRONTEND_URL to your Vercel origin.');
    }

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

    // Default rules creation removed - users create rules manually
    console.log('📋 No automatic rule creation - use dashboard to create rules');

    await initWhatsApp();
});
