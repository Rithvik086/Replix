import mongoose from 'mongoose';

export interface IMessage extends mongoose.Document {
    user: mongoose.Types.ObjectId | string;
    chatId: string;
    from: string;
    to: string;
    body: string;
    direction: 'in' | 'out';
    timestamp: Date;
    status?: string;
    reply?: string;
    llmConfidence?: number;
}

const messageSchema = new mongoose.Schema<IMessage>({
    // user is optional because messages may arrive before we associate them to a registered user
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    chatId: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    body: { type: String, required: true },
    direction: { type: String, enum: ['in', 'out'], required: true },
    timestamp: { type: Date, default: Date.now },
    status: { type: String },
    reply: { type: String },
    llmConfidence: { type: Number }
});

export default mongoose.model<IMessage>('Message', messageSchema);
