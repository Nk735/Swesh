import express from 'express';
import { registerUser, loginUser, getMe, likeItem, dislikeItem, updateMyAvatar, completeOnboarding } from '../controllers/user.js';
import { protect } from '../middleware/auth.js';
import { validateOnboarding } from '../middleware/validate.js';

const router = express.Router();

// @desc    Register new user
router.post('/register', registerUser);

// @desc    Authenticate user & get token
router.post('/login', loginUser);

// @desc    Get current user
router.get('/me', protect, getMe);

// @desc    Update my avatar (default avatar picker)
router.patch('/me/avatar', protect, updateMyAvatar);

// @desc    Complete onboarding
router.post('/complete-onboarding', protect, validateOnboarding, completeOnboarding);

// @desc    Like item
router.post('/like', protect, likeItem);

// @desc    Dislike item
router.post('/dislike', protect, dislikeItem);

export default router;
