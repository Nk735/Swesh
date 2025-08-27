import User from '../models/User.js';
import Item from '../models/Item.js';
import jwt from 'jsonwebtoken';

const generateToken = (user) => jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /api/auth/login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Utente non trovato' });
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(403).json({ message: 'Password errata' });
    return res.status(200).json({ token: generateToken(user) });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

// POST /api/auth/register
export const registerUser = async (req, res) => {
  const { email, password, nickname } = req.body;
  if (!email || !password || !nickname) {
    return res.status(400).json({ message: 'Campi mancanti' });
  }
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(403).json({ message: 'Email già registrata' });
    const user = await User.create({ email, password, nickname });
    return res.status(201).json({ token: generateToken(user) });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -__v');
    if (!user) return res.status(404).json({ message: 'Utente non trovato' });
    return res.json({ id: user._id, email: user.email, nickname: user.nickname, avatarUrl: user.avatarUrl });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

// (Non ancora esposte) Like / Dislike item
export const likeItem = async (req, res) => {
  try {
    const item = await Item.findById(req.body.id);
    if (!item) return res.status(404).json({ message: 'Item non trovato' });
    const user = await req.user.likeItem(item._id);
    return res.json({ likedItems: user.likedItems });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

export const dislikeItem = async (req, res) => {
  try {
    const item = await Item.findById(req.body.id);
    if (!item) return res.status(404).json({ message: 'Item non trovato' });
    const user = await req.user.dislikeItem(item._id);
    return res.json({ dislikedItems: user.dislikedItems });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};
