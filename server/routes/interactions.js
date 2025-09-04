import express from 'express';
import { protect } from '../middleware/auth.js';
import { upsertInteraction, getMyLikes } from '../controllers/interactions.js';

const router = express.Router();

// Crea / aggiorna una interaction (like / dislike / skip)
router.post('/', protect, upsertInteraction);

// (Opzionale) elenco dei like dell’utente
//router.get('/like', protect, getMyLikes);

export default router;