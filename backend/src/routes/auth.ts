import express from 'express';
import { register, login, logout, getProfile } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/profile', authenticate, getProfile);

export default router;
