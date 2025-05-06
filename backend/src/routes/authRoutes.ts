import { Router } from 'express';
import { login, register, verifyToken } from '../controllers/authController';
import authenticate from '../middleware/auth';

const router = Router();

// Public auth routes
router.post('/login', login);
router.post('/register', register);
router.post('/verify', verifyToken);

// Protected route example
router.get('/user', authenticate, (req, res) => {
  res.json({ 
    user: req.user,
    message: 'User authenticated successfully'
  });
});

export default router;