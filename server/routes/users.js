import express from 'express';
import { updateFeedPreferences } from '../controllers/user.js';
import { protect } from '../middleware/auth.js';
import { validateFeedPreferences } from '../middleware/validate.js';

const router = express.Router();

// @desc    Update feed preferences
router.patch('/me/preferences', protect, validateFeedPreferences, updateFeedPreferences);

export default router;
