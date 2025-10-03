import express from 'express';
import Item from '../models/Item.js';
import { protect } from '../middleware/auth.js';
import ItemInteraction from '../models/ItemInteraction.js';
import { validateItemBody } from '../middleware/validate.js';

const router = express.Router();

// Create new item
router.post('/', protect, validateItemBody, async (req, res) => {
  try {
    const { title, description, imageUrl, size, category, images, condition, isAvailable } = req.body;

    const payload = {
      title,
      description,
      owner: req.user._id,
    };

    // Se abbiamo images[], usiamo quello e generiamo imageUrl dal primo elemento
    if (images && images.length > 0) {
      payload.images = images;
      payload.imageUrl = images[0];
    } else if (imageUrl) {
      payload.imageUrl = imageUrl;
    }

    // Includi solo se presenti (evita stringhe vuote)
    if (size) payload.size = size;
    if (category) payload.category = category;
    if (condition) payload.condition = condition;
    if (typeof isAvailable === 'boolean') payload.isAvailable = isAvailable;

    const item = await Item.create(payload);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Feed: escludi i miei + già interagiti (like/dislike/skip) + non disponibili
router.get('/', protect, async (req, res) => {
  try {
    const interactedIds = await ItemInteraction.find({ user: req.user._id }).distinct('item');

    const query = {
      owner: { $ne: req.user._id },
      isAvailable: true, // Solo item disponibili
      ...(interactedIds.length ? { _id: { $nin: interactedIds } } : {}),
    };

    const items = await Item.find(query).populate('owner', 'nickname avatarUrl');
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/mine', protect, async (req, res) => {
  try {
    const items = await Item.find({ owner: req.user._id });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single item by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('owner', 'nickname avatarUrl');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE un abito se proprietario
router.delete('/:id', protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item non trovato' });
    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorizzato' });
    }
    await item.deleteOne();
    res.json({ message: 'Abito eliminato' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
