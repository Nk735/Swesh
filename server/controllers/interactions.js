import Item from '../models/Item.js';
import ItemInteraction from '../models/ItemInteraction.js';
import { checkForTinderMatch } from '../services/matchService.js';

export const upsertInteraction = async (req, res) => {
  try {
    const { itemId, action } = req.body;
    if (!itemId || !action) return res.status(400).json({ message: 'itemId e action richiesti' });
    if (!['like', 'dislike', 'skip'].includes(action)) {
      return res.status(400).json({ message: 'Azione non valida' });
    }

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item non trovato' });
    if (item.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Non puoi interagire con un tuo item' });
    }

    // Una sola entry per (user,item), aggiorniamo l’azione
    const interaction = await ItemInteraction.findOneAndUpdate(
      { user: req.user._id, item: item._id },
      { action },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    let matchInfo = null;
    if (action === 'like') {
      const match = await checkForTinderMatch({ userId: req.user._id, likedItemId: item._id });
      if (match?.matched) {
        matchInfo = match;
      }
    }

    return res.status(200).json({
      itemId: item._id,
      action: interaction.action,
      // updatedAt sarà valorizzato se abilitiamo timestamps nello schema
      updatedAt: interaction.updatedAt || interaction.createdAt,
      ...(matchInfo ? { match: matchInfo } : {})
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// lista dei like dell’utente
export const getMyLikes = async (req, res) => {
  try {
    const docs = await ItemInteraction
      .find({ user: req.user._id, action: 'like' })
      .sort({ updatedAt: -1 })
      .populate('item');
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};