import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { initWhatsApp, getQrCode, getStatus } from "./whatsapp";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

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
