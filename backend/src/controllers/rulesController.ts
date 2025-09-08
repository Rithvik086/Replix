import { Request, Response } from 'express';
import Rule from '../models/Rule';

// Get all rules
export const getRules = async (req: Request, res: Response) => {
    try {
        const rules = await Rule.find().sort({ priority: -1, createdAt: -1 });
        res.json({ success: true, rules });
    } catch (error: any) {
        console.error('Get rules error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch rules' });
    }
};

// Create new rule
export const createRule = async (req: Request, res: Response) => {
    try {
        const ruleData = req.body;

        // Validate required fields
        if (!ruleData.name || !ruleData.conditions || !ruleData.response) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields: name, conditions, response'
            });
            return;
        }

        const rule = new Rule(ruleData);
        await rule.save();

        res.status(201).json({ success: true, rule });
    } catch (error: any) {
        console.error('Create rule error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create rule'
        });
    }
};

// Update rule
export const updateRule = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const rule = await Rule.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!rule) {
            res.status(404).json({ success: false, message: 'Rule not found' });
            return;
        }

        res.json({ success: true, rule });
    } catch (error: any) {
        console.error('Update rule error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update rule'
        });
    }
};

// Delete rule
export const deleteRule = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const rule = await Rule.findByIdAndDelete(id);

        if (!rule) {
            res.status(404).json({ success: false, message: 'Rule not found' });
            return;
        }

        res.json({ success: true, message: 'Rule deleted successfully' });
    } catch (error: any) {
        console.error('Delete rule error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete rule'
        });
    }
};

// Toggle rule enabled/disabled
export const toggleRule = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const rule = await Rule.findById(id);
        if (!rule) {
            res.status(404).json({ success: false, message: 'Rule not found' });
            return;
        }

        rule.enabled = !rule.enabled;
        await rule.save();

        res.json({ success: true, rule });
    } catch (error: any) {
        console.error('Toggle rule error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle rule'
        });
    }
};
