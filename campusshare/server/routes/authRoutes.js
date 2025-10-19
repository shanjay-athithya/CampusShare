import express from 'express';
import { register, login, getProfile } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/auth/register
// Body: { name, email, password, department }
// Response: { message, token, user }
router.post('/register', register);

// POST /api/auth/login  
// Body: { email, password }
// Response: { message, token, user }
router.post('/login', login);

// GET /api/auth/me - Get current user profile (protected)
// Headers: Authorization: Bearer <token>
// Response: { user }
router.get('/me', authenticate, getProfile);

export default router;
