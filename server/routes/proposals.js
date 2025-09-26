{/*import express from 'express';
import { protect } from '../middleware/auth.js';
import { incrementDailyProposalsOrThrow } from '../services/rateLimitService.js';
import { createPendingProposal } from '../services/proposalService.js';
import { tryMatchAndCreate } from '../services/matchService.js';

const router = express.Router();

// POST /api/proposals
router.post('/', protect, async (req, res) => {
  try {
    const { targetItemId, offeredItemId } = req.body;
    if (!targetItemId || !offeredItemId) {
      return res.status(400).json({ message: 'targetItemId e offeredItemId sono richiesti' });
    }
    await incrementDailyProposalsOrThrow(req.user._id);
    const proposal = await createPendingProposal({
      proposerUserId: req.user._id,
      targetItemId,
      offeredItemId
    });

    // Tentativo di matching immediato
    const matchResult = await tryMatchAndCreate({ newProposal: proposal });
    if (matchResult.matched) {
      return res.status(201).json({
        status: 'matched',
        matchId: matchResult.matchId,
        chatId: matchResult.chatId
      });
    }
    return res.status(201).json({ status: 'pending', proposalId: proposal._id });
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
});

export default router;*/}