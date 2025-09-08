import express from 'express';
import { getMessages, createMessage, cleanupMessages, setRetention } from '../controllers/messageController';
import { authenticate } from '../middleware/auth';

const router = express.Router();
router.use(authenticate)
router.get('/', getMessages);
router.post('/', createMessage);
router.delete('/cleanup', cleanupMessages);
router.post('/retention', setRetention);

export default router;
