import express from 'express';
import { getMessages, createMessage, cleanupMessages, setRetention } from '../controllers/messageController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, getMessages);
router.post('/', authenticate, createMessage);
router.delete('/cleanup', authenticate, cleanupMessages);
router.post('/retention', authenticate, setRetention);

export default router;
