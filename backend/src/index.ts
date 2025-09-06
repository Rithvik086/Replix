import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/database";
import authRoutes from "./routes/auth";
import { initWhatsApp, getQrCode, getStatus } from "./whatsapp";

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

// Start server
app.listen(PORT, async () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    await initWhatsApp();
});
