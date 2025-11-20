import express from 'express';
import { protect } from '../middleware/auth.js';
import Match from '../models/Match.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import mongoose from 'mongoose';

const router = express.Router();

// Helper
async function loadMatchAndChat(matchId, userId) {
  const match = await Match.findById(matchId);
  if (!match) return { error: 'Match non trovato' };
  if (
    String(match.userAId) !== String(userId) &&
    String(match.userBId) !== String(userId)
  ) {
    return { error: 'Non autorizzato' };
  }
  let chat = await Chat.findOne({ matchId: match._id });
  if (!chat) {
    chat = await Chat.create({
      matchId: match._id,
      participants: [match.userAId, match.userBId],
      lastMessageAt: new Date(),
      unreadCountByUser: new Map([
        [String(match.userAId), 0],
        [String(match.userBId), 0]
      ])
    });
    match.chatId = chat._id;
    await match.save();
  }
  return { match, chat };
}

// GET /api/chat/:matchId/messages
router.get('/:matchId/messages', protect, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { match, chat, error } = await loadMatchAndChat(matchId, req.user._id);
    if (error) return res.status(error === 'Non autorizzato' ? 403 : 404).json({ message: error });

    // Messaggi (limite 100 ultimi)
    const messages = await Message.find({ chatId: chat._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Reset unread per me
    const myKey = String(req.user._id);
    if (chat.unreadCountByUser.get
      ? (chat.unreadCountByUser.get(myKey) || 0) > 0
      : (chat.unreadCountByUser[myKey] || 0) > 0) {
      if (chat.unreadCountByUser.set) {
        chat.unreadCountByUser.set(myKey, 0);
      } else {
        chat.unreadCountByUser[myKey] = 0;
      }
      await chat.save();
    }

    const enriched = messages
      .reverse()
      .map(m => ({
        _id: m._id,
        content: m.content,
        senderId: m.senderId,
        createdAt: m.createdAt,
        read: true // dopo fetch li consideriamo letti
      }));

    res.json({
      matchStatus: match.status,
      ...(match.cancellation ? { cancellation: match.cancellation } : {}),
      messages: enriched
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/chat/:matchId/messages
router.post('/:matchId/messages', protect, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Contenuto richiesto' });
    }
    const { match, chat, error } = await loadMatchAndChat(matchId, req.user._id);
    if (error) return res.status(error === 'Non autorizzato' ? 403 : 404).json({ message: error });

    if (match.status !== 'active') {
      return res.status(409).json({ message: 'Match non attivo: chat in sola lettura' });
    }

    const msg = await Message.create({
      chatId: chat._id,
      senderId: req.user._id,
      content: content.trim(),
      readBy: [req.user._id]
    });

    // Aggiorna lastMessageAt e unread per l'altro
    const otherUserId = String(req.user._id) === String(match.userAId) ? String(match.userBId) : String(match.userAId);
    chat.lastMessageAt = new Date();
    const currentUnread = chat.unreadCountByUser.get
      ? (chat.unreadCountByUser.get(otherUserId) || 0)
      : (chat.unreadCountByUser[otherUserId] || 0);
    const newUnread = currentUnread + 1;
    if (chat.unreadCountByUser.set) {
      chat.unreadCountByUser.set(otherUserId, newUnread);
    } else {
      chat.unreadCountByUser[otherUserId] = newUnread;
    }
    await chat.save();

    // Aggiorna match.lastActivityAt
    match.lastActivityAt = chat.lastMessageAt;
    await match.save();

    res.status(201).json({
      _id: msg._id,
      content: msg.content,
      senderId: msg.senderId,
      createdAt: msg.createdAt,
      read: false
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;