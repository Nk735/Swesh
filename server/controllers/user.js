import User from '../models/User.js';
import Item from '../models/Item.js';
import jwt from 'jsonwebtoken';

const signToken = (user) => jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });

// @route POST /api/auth/login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) return res.status(400).json({ message: 'Email e password richiesti' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Utente non trovato' });
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(403).json({ message: 'Credenziali non valide' });
    const token = signToken(user);
    return res.status(200).json({ token });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// @route POST /api/auth/register
export const registerUser = async (req, res) => {
  const { email, password, nickname } = req.body;
  if (!email || !password || !nickname) return res.status(400).json({ message: 'Campi mancanti' });
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email già registrata' });
    const user = await User.create({ email, password, nickname });
    const token = signToken(user);
    return res.status(201).json({ token });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// @route GET /api/auth/me (protetto)
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -__v');
    if (!user) return res.status(404).json({ message: 'Utente non trovato' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Extra (non ancora mappate nel client, lasciamo per futura integrazione)
export const likeItem = async (req, res) => {
  try {
    const item = await Item.findById(req.body.id);
    if (!item) return res.status(404).json({ message: 'Item non trovato' });
    const user = await req.user.likeItem(item._id);
    return res.status(200).json(user.likedItems);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const dislikeItem = async (req, res) => {
  try {
    const item = await Item.findById(req.body.id);
    if (!item) return res.status(404).json({ message: 'Item non trovato' });
    const user = await req.user.dislikeItem(item._id);
    return res.status(200).json(user.dislikedItems);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateMyAvatar = async (req, res) => {
  try {
    const { avatarKey } = req.body;
    
    if (!avatarKey) {
      return res.status(400). json({ message: 'avatarKey richiesto' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatarKey },
      { new: true }
    ). select('-password -__v');

    if (!user) return res.status(404).json({ message: 'Utente non trovato' });

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// @route POST /api/auth/complete-onboarding (protetto)
export const completeOnboarding = async (req, res) => {
  try {
    const { age, gender, feedPreference } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        age,
        gender,
        feedPreferences: { showGender: feedPreference },
        onboarding: {
          completed: true,
          completedAt: new Date()
        }
      },
      { new: true }
    ).select('-password -__v');

    if (!user) return res.status(404).json({ message: 'Utente non trovato' });

    return res.json({ message: 'Onboarding completato', user });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// @route PATCH /api/users/me/preferences (protetto)
export const updateFeedPreferences = async (req, res) => {
  try {
    const { showGender } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 'feedPreferences.showGender': showGender },
      { new: true }
    ).select('-password -__v');

    if (!user) return res.status(404).json({ message: 'Utente non trovato' });

    return res.json({ 
      message: 'Preferenze aggiornate', 
      feedPreferences: user.feedPreferences 
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
