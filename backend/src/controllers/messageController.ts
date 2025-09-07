import { Request, Response } from 'express';
import Message from '../models/Message';

export const getMessages = async (req: Request, res: Response) => {
    try {
        // Optional query params: chatId, limit, skip
        const { chatId, limit = 50, skip = 0 } = req.query as any;
        const filter: any = {};
        if (chatId) filter.chatId = chatId;

        console.log('[DB] getMessages called', { filter, limit: Number(limit), skip: Number(skip) });
        const messages = await Message.find(filter)
            .sort({ timestamp: -1 })
            .limit(Number(limit))
            .skip(Number(skip));

        console.log('[DB] getMessages returned', { count: messages.length });

        res.json({ success: true, messages });
    } catch (err: any) {
        console.error('Get messages error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const createMessage = async (req: Request, res: Response) => {
    try {
        const payload = req.body;
        console.log('[DB] createMessage called', { payload: { chatId: payload.chatId, from: payload.from, to: payload.to, direction: payload.direction } });
        const message = new Message(payload);
        await message.save();
        console.log('[DB] createMessage saved', { id: message._id });
        res.status(201).json({ success: true, message });
    } catch (err: any) {
        console.error('Create message error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const cleanupMessages = async (req: Request, res: Response) => {
    try {
        // days can be provided as query param, fall back to env or 30
        const days = Number(req.query.days ?? process.env.MESSAGE_TTL_DAYS ?? 30);
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        console.log('[DB] cleanupMessages called', { days, cutoff });
        const result = await Message.deleteMany({ timestamp: { $lt: cutoff } });
        console.log('[DB] cleanupMessages deleted', { deletedCount: result.deletedCount });
        res.json({ success: true, deletedCount: result.deletedCount });
    } catch (err: any) {
        console.error('Cleanup messages error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const cleanupRange = async (req: Request, res: Response) => {
    try {
        const { from, to } = req.query as any;
        if (!from || !to) {
            res.status(400).json({ success: false, message: 'from and to query params required' });
            return;
        }
        const fromDate = new Date(from);
        const toDate = new Date(to);
        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            res.status(400).json({ success: false, message: 'Invalid date format' });
            return;
        }
        console.log('[DB] cleanupRange called', { from: fromDate, to: toDate });
        const result = await Message.deleteMany({ timestamp: { $gte: fromDate, $lte: toDate } });
        console.log('[DB] cleanupRange deleted', { deletedCount: result.deletedCount });
        res.json({ success: true, deletedCount: result.deletedCount });
        return;
    } catch (err: any) {
        console.error('Cleanup range error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


export const setRetention = async (req: Request, res: Response) => {
    try {
        const { days } = req.body as any;
        const ttlDays = Number(days);
        if (!Number.isFinite(ttlDays) || ttlDays <= 0) {
            res.status(400).json({ success: false, message: 'Invalid days value' });
            return;
        }

        // drop existing TTL index on timestamp if present
        try {
            const indexes = await Message.collection.indexes();
            const ttlIndex = indexes.find((i: any) => i.expireAfterSeconds !== undefined && i.key && i.key.timestamp === 1);
            if (ttlIndex && ttlIndex.name) {
                await Message.collection.dropIndex(ttlIndex.name);
            }
        } catch (e) {
            // ignore drop errors
            console.warn('No existing TTL index to drop or drop failed:', e);
        }

        console.log('[DB] setRetention creating TTL index', { ttlDays });
        await Message.collection.createIndex({ timestamp: 1 }, { expireAfterSeconds: ttlDays * 24 * 60 * 60 });
        console.log('[DB] setRetention created TTL index');
        res.json({ success: true, ttlDays });
        return;
    } catch (err: any) {
        console.error('Set retention error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
