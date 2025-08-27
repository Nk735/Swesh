import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

// Protect routes
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        res.status(401);
        return res.json({ message: 'Utente non trovato per questo token' });
      }
      return next();
    } catch (e) {
      res.status(401);
      return res.json({ message: 'Token non valido' });
    }
  }

  if (!token) {
    res.status(401);
    return res.json({ message: 'Token mancante' });
  }
});
