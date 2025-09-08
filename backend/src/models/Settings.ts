import mongoose from 'mongoose';

export interface ISettings extends mongoose.Document {
    botEnabled: boolean;
    sleepStart?: string | null; // HH:MM in 24h
    sleepEnd?: string | null; // HH:MM in 24h
    timezone?: string | null; // e.g. 'UTC' or 'Asia/Kolkata'
    replyToPersonalChats: boolean;
    replyToGroupChats: boolean;
}

const settingsSchema = new mongoose.Schema<ISettings>({
    botEnabled: { type: Boolean, default: true },
    sleepStart: { type: String, required: false, default: null },
    sleepEnd: { type: String, required: false, default: null },
    timezone: { type: String, required: false, default: null },
    replyToPersonalChats: { type: Boolean, default: true },
    replyToGroupChats: { type: Boolean, default: false }
});

// Singleton pattern: we will keep a single settings document
export default mongoose.model<ISettings>('Settings', settingsSchema);
