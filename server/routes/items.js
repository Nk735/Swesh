import express from 'express';
import Item from '../models/Item.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import ItemInteraction from '../models/ItemInteraction.js';
import { validateItemBody } from '../middleware/validate.js';

const router = express.Router();

// Helper function to determine user's show gender preference
function getUserShowGender(user) {
  // If user has explicit feed preference, use that
  if (user.feedPreferences?.showGender) {
    return user.feedPreferences.showGender;
  }
  // Otherwise, default based on gender
  if (user.gender === 'male') return 'male';
  if (user.gender === 'female') return 'female';
  // For 'prefer_not_to_say' or unset, show all
  return 'all';
}

// Create new item
router.post('/', protect, validateItemBody, async (req, res) => {
  try {
    const { title, description, imageUrl, size, category, images, condition, isAvailable, visibleTo } = req.body;

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
    
    // Add visibleTo if provided, otherwise it will be null (inherit from owner gender)
    if (visibleTo) payload.visibleTo = visibleTo;

    const item = await Item.create(payload);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Feed: escludi i miei + già interagiti (like/dislike/skip) + non disponibili + filtro per genere
router.get('/', protect, async (req, res) => {
  try {
    const interactedIds = await ItemInteraction.find({ user: req.user._id }).distinct('item');

    // Get user's showGender preference
    const showGender = getUserShowGender(req.user);

    let query = {
      owner: { $ne: req.user._id },
      isAvailable: true,
      ...(interactedIds.length ? { _id: { $nin: interactedIds } } : {}),
    };

    // Apply gender filter if not 'all'
    if (showGender !== 'all') {
      const items = await Item.find(query)
        .populate('owner', 'nickname avatarUrl gender')
        .lean();

      // Filter items based on visibility rules:
      // 1. Items with explicit visibleTo matching user preference or 'all' are shown
      // 2. Items with null visibleTo inherit from owner's gender
      // 3. Items from owners with 'prefer_not_to_say' or unset gender are shown to everyone
      //    (Design decision: neutral gender items are inclusive by default)
      const filteredItems = items.filter(item => {
        if (item.visibleTo) {
          return item.visibleTo === showGender || item.visibleTo === 'all';
        }
        const ownerGender = item.owner?.gender;
        if (ownerGender === showGender) return true;
        // Owners with unset or 'prefer_not_to_say' gender have items visible to all
        if (!ownerGender || ownerGender === 'prefer_not_to_say') return true;
        return false;
      });

      return res.json(filteredItems);
    }

    // If showGender is 'all', return all items
    const items = await Item.find(query).populate('owner', 'nickname avatarUrl gender').lean();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/mine', protect, async (req, res) => {
  try {
    // Use lean() for better performance on read-only queries
    const items = await Item.find({ owner: req.user._id }).lean();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single item by ID
router.get('/:id', protect, async (req, res) => {
  try {
    // Use lean() for better performance on read-only queries
    const item = await Item.findById(req.params.id).populate('owner', 'nickname avatarUrl').lean();
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
