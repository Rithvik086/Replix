import Rule, { IRule } from '../models/Rule';

interface MessageContext {
    body: string;
    from: string;
    isGroup: boolean;
    timestamp: Date;
}

interface RuleResult {
    matched: boolean;
    rule?: IRule;
    response?: string | undefined;
    useAI: boolean;
}

// Helper to get a Date adjusted to IST (Asia/Kolkata) for logging and time checks
const toIST = (d: Date = new Date()) => new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

// Check if a message matches rule conditions
const checkConditions = (conditions: IRule['conditions'], context: MessageContext): boolean => {
    // All conditions must be true (AND logic)
    return conditions.every(condition => {
        switch (condition.type) {
            case 'keyword':
                return checkKeywordCondition(condition, context.body);
            case 'time':
                return checkTimeCondition(condition, context.timestamp);
            case 'contact':
                return checkContactCondition(condition, context.from);
            case 'message_type':
                return checkMessageTypeCondition(condition, context);
            default:
                return false;
        }
    });
};

// Check keyword-based conditions
const checkKeywordCondition = (condition: any, messageBody: string): boolean => {
    const text = condition.caseSensitive ? messageBody : messageBody.toLowerCase();
    const values = Array.isArray(condition.value) ? condition.value : [condition.value];

    return values.some((value: string) => {
        const searchValue = condition.caseSensitive ? value : value.toLowerCase();

        switch (condition.operator) {
            case 'contains':
                return text.includes(searchValue);
            case 'equals':
                return text === searchValue;
            case 'starts_with':
                return text.startsWith(searchValue);
            case 'ends_with':
                return text.endsWith(searchValue);
            default:
                return false;
        }
    });
};

// Check time-based conditions
const checkTimeCondition = (condition: any, timestamp: Date): boolean => {
    // Use IST (Asia/Kolkata) for human-facing logs and checks so times align with IST users
    const istNow = toIST();
    const currentHour = istNow.getHours();
    const currentMinute = istNow.getMinutes();
    const currentTime = currentHour * 60 + currentMinute; // Minutes since midnight (IST)

    console.log(`🕐 Current time (IST): ${currentHour}:${currentMinute.toString().padStart(2, '0')} (${currentTime} minutes) — Asia/Kolkata`);

    if (condition.operator === 'between' && Array.isArray(condition.value) && condition.value.length === 2) {
        const [startTime, endTime] = condition.value;
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        const start = startHour * 60 + startMin;
        const end = endHour * 60 + endMin;

        console.log(`🕐 Checking time range: ${startTime} (${start}) to ${endTime} (${end})`);

        if (start <= end) {
            // Same day range (e.g., 09:00 to 18:00)
            const result = currentTime >= start && currentTime <= end;
            console.log(`🕐 Same day range check: ${result}`);
            return result;
        } else {
            // Overnight range (e.g., 18:01 to 08:59)
            const result = currentTime >= start || currentTime <= end;
            console.log(`🕐 Overnight range check: ${result}`);
            return result;
        }
    }

    return false;
};

// Check contact-based conditions
const checkContactCondition = (condition: any, from: string): boolean => {
    const values = Array.isArray(condition.value) ? condition.value : [condition.value];

    return values.some((value: string) => {
        switch (condition.operator) {
            case 'equals':
                return from === value;
            case 'contains':
                return from.includes(value);
            case 'starts_with':
                return from.startsWith(value);
            case 'ends_with':
                return from.endsWith(value);
            default:
                return false;
        }
    });
};

// Check message type conditions
const checkMessageTypeCondition = (condition: any, context: MessageContext): boolean => {
    switch (condition.value) {
        case 'group':
            return context.isGroup;
        case 'personal':
            return !context.isGroup;
        default:
            return false;
    }
};

// Process message against all rules
export const processRules = async (context: MessageContext): Promise<RuleResult> => {
    try {
        // Get all enabled rules, sorted by priority (highest first)
        const rules = await Rule.find({ enabled: true }).sort({ priority: -1, createdAt: -1 });

        // Find first matching rule
        for (const rule of rules) {
            if (checkConditions(rule.conditions, context)) {
                console.log(`📋 Rule matched: "${rule.name}"`);

                let response: string | undefined;
                let useAI = false;

                switch (rule.response.type) {
                    case 'text':
                        response = rule.response.content;
                        useAI = rule.response.useAI || false;
                        break;
                    case 'ai':
                        useAI = true;
                        break;
                    case 'none':
                        // No response, just log or take action
                        break;
                }

                return {
                    matched: true,
                    rule,
                    response: response,
                    useAI
                };
            }
        }

        // No rules matched, default to AI
        console.log('📋 No rules matched, using default AI response');
        return {
            matched: false,
            useAI: true
        };

    } catch (error) {
        console.error('Error processing rules:', error);
        // Fallback to AI on error
        return {
            matched: false,
            useAI: true
        };
    }
};

// Helper function to create default rules
export const createDefaultRules = async () => {
    try {
        console.log('📋 Default rules creation disabled - starting with clean slate');
        return; // Exit early, no default rules

        const existingRules = await Rule.countDocuments();
        if (existingRules > 0) {
            console.log('📋 Rules already exist, skipping default creation');
            return;
        }

        // Default rules removed - users can create their own rules
        console.log('📋 No default rules configured - create rules manually in the dashboard');

    } catch (error) {
        console.error('Error in rules initialization:', error);
    }
};
