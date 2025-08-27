import express from 'express';
import Item from '../models/Item.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create new item
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, imageUrl, size, category } = req.body;
    const item = await Item.create({
      title,
      description,
      imageUrl,
      size,
      category,
      owner: req.user._id,
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all items except those owned by current user
router.get('/', protect, async (req, res) => {
  try {
    const items = await Item.find({ owner: { $ne: req.user._id } }).populate('owner', 'nickname avatarUrl');
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

export default router;
