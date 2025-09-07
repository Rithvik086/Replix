import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, getSettings);
router.post('/', authenticate, updateSettings);

export default router;
