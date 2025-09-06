import { Client, LocalAuth, Message } from "whatsapp-web.js";
import qrcode from "qrcode";
import axios from "axios";
// WhatsApp client instance
let client: Client;
let qrCode: string | null = null;
let connectionStatus: "not_connected" | "qr_generated" | "connected" = "not_connected";

// Initialize WhatsApp client
export const initWhatsApp = async () => {
    client = new Client({
        authStrategy: new LocalAuth(), // stores session locally
        puppeteer: { headless: true }
    });

    // When QR is received
    client.on("qr", async (qr: string) => {
        qrCode = await qrcode.toDataURL(qr); // convert QR to base64
        connectionStatus = "qr_generated";
        console.log("📸 QR code generated, scan it with your WhatsApp!");
    });

    // When client is ready
    client.on("ready", () => {
        console.log("✅ WhatsApp is connected!");
        connectionStatus = "connected";
    });

    // Handle incoming messages
    client.on("message", async (message: Message) => {
        console.log(`📩 Message from ${message.from}: ${message.body}`);
        const reply = await getAutoReply(message.body);  // async call
        if (reply) {
            await message.reply(reply);
            console.log(`🤖 Replied: ${reply}`);
        }
    });


    // Handle disconnected
    client.on("disconnected", (reason) => {
        console.log("⚠️ WhatsApp disconnected:", reason);
        connectionStatus = "not_connected";
    });

    await client.initialize();
};

// Simple auto-reply logic

const getAutoReply = async (text: string) => {
    try {
        console.log("🤖 Getting auto-reply for:", text);
        console.log("🔑 API Key exists:", !!process.env.GEMINI_API_KEY);

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        parts: [{ text }]
                    }
                ]
            },
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        // console.log("✅ Gemini response:", response.data);

        // Gemini response structure
        const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
        return reply || "Sorry, I couldn't generate a response.";
    } catch (err: any) {
        console.error("❌ Error fetching auto-reply:", err.response?.data || err.message);
        return "Sorry, I can't respond right now.";
    }
};



// Get current QR code (base64)
export const getQrCode = () => qrCode;

// Get connection status
export const getStatus = () => connectionStatus;
