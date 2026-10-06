import { Router } from 'express';
import { login, register, getMe, logout, getAllUsers } from '../controllers/authController.ts';
import { requireAuth } from '../middleware/authMiddleware.ts';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);
router.get('/users', getAllUsers);

export default router;
