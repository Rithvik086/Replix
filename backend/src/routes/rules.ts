import express from 'express';
import { getRules, createRule, updateRule, deleteRule, toggleRule } from '../controllers/rulesController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/rules - Get all rules
router.get('/', getRules);

// POST /api/rules - Create new rule
router.post('/', createRule);

// PUT /api/rules/:id - Update rule
router.put('/:id', updateRule);

// DELETE /api/rules/:id - Delete rule
router.delete('/:id', deleteRule);

// PATCH /api/rules/:id/toggle - Toggle rule enabled/disabled
router.patch('/:id/toggle', toggleRule);

export default router;
