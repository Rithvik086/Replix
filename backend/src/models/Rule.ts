import mongoose from 'mongoose';

export interface IRule extends mongoose.Document {
    name: string;
    description?: string;
    enabled: boolean;
    priority: number; // Higher number = higher priority
    conditions: {
        type: 'keyword' | 'time' | 'contact' | 'message_type';
        operator: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'between';
        value: string | string[];
        caseSensitive?: boolean;
    }[];
    response: {
        type: 'text' | 'ai' | 'none';
        content?: string; // For text responses
        useAI?: boolean; // Whether to also use AI after this response
    };
    createdAt: Date;
    updatedAt: Date;
}

const ruleSchema = new mongoose.Schema<IRule>({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    enabled: {
        type: Boolean,
        default: true
    },
    priority: {
        type: Number,
        default: 1,
        min: 1,
        max: 100
    },
    conditions: [{
        type: {
            type: String,
            enum: ['keyword', 'time', 'contact', 'message_type'],
            required: true
        },
        operator: {
            type: String,
            enum: ['contains', 'equals', 'starts_with', 'ends_with', 'between'],
            required: true
        },
        value: {
            type: mongoose.Schema.Types.Mixed, // Can be string or array
            required: true
        },
        caseSensitive: {
            type: Boolean,
            default: false
        }
    }],
    response: {
        type: {
            type: String,
            enum: ['text', 'ai', 'none'],
            required: true
        },
        content: {
            type: String,
            maxlength: 2000
        },
        useAI: {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true
});

// Index for priority-based queries
ruleSchema.index({ enabled: 1, priority: -1 });

const Rule = mongoose.model<IRule>('Rule', ruleSchema);
export default Rule;
