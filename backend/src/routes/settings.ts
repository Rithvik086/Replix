import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { authenticate } from '../middleware/auth';

const router = express.Router();
router.use(authenticate);
router.get('/', getSettings);
router.post('/', updateSettings);

export default router;
