import { Request, Response } from 'express';
import Settings from '../models/Settings';

// Ensure single settings document exists
const getSingleton = async () => {
    let s = await Settings.findOne();
    if (!s) {
        s = await Settings.create({});
    }
    return s;
};

export const getSettings = async (req: Request, res: Response) => {
    try {
        const s = await getSingleton();
        res.json({ success: true, settings: s });
    } catch (err: any) {
        console.error('Get settings error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const payload = req.body;
        const s = await getSingleton();
        s.botEnabled = typeof payload.botEnabled === 'boolean' ? payload.botEnabled : s.botEnabled;
        s.sleepStart = payload.sleepStart ?? s.sleepStart;
        s.sleepEnd = payload.sleepEnd ?? s.sleepEnd;
        s.timezone = payload.timezone ?? s.timezone;
        s.replyToPersonalChats = typeof payload.replyToPersonalChats === 'boolean' ? payload.replyToPersonalChats : s.replyToPersonalChats;
        s.replyToGroupChats = typeof payload.replyToGroupChats === 'boolean' ? payload.replyToGroupChats : s.replyToGroupChats;
        await s.save();
        res.json({ success: true, settings: s });
    } catch (err: any) {
        console.error('Update settings error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
