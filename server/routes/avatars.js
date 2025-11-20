import express from 'express';
import { protect } from '../middleware/auth.js';
import { AVATARS_V1 } from '../config/avatars.js';

const router = express.Router();

// GET /api/avatars - ritorna il catalogo predefinito
router.get('/', protect, (req, res) => {
  res.set('Cache-Control', 'public, max-age=86400');
  res.json({ avatars: AVATARS_V1 });
});

export default router;