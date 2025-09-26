import express from 'express';
import { protect } from '../middleware/auth.js';
import { upsertInteraction, getMyLikes } from '../controllers/interactions.js';

const router = express.Router();

// Crea / aggiorna una interaction (like / dislike / skip)
// Ora con logica di match automatico per i like
router.post('/', protect, upsertInteraction);

// Ottieni i like dell'utente
router.get('/likes', protect, getMyLikes);

// Ottieni statistiche delle interazioni dell'utente
//router.get('/stats', protect, getInteractionStats);

export default router;