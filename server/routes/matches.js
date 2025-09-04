import express from 'express';
import { protect } from '../middleware/auth.js';
import Match from '../models/Match.js';
import Chat from '../models/Chat.js';
import Item from '../models/Item.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const router = express.Router();

// GET /api/matches
// ?groupByUser=true per raggruppare
router.get('/', protect, async (req, res) => {
  try {
    const groupByUser = req.query.groupByUser === 'true';

    // Recupera matches dove l'utente è userA o userB
    const userId = req.user._id;
    const matches = await Match.find({
      $or: [{ userAId: userId }, { userBId: userId }]
    })
      .sort({ lastActivityAt: -1 })
      .lean();

    const matchIds = matches.map(m => m._id);
    const chats = await Chat.find({ matchId: { $in: matchIds } }).lean();
    const chatMap = new Map(chats.map(c => [String(c.matchId), c]));

    // Precarica items & utenti
    const itemIds = [];
    matches.forEach(m => {
      itemIds.push(m.itemAId, m.itemBId);
    });
    const items = await Item.find({ _id: { $in: itemIds } }).lean();
    const itemMap = new Map(items.map(i => [String(i._id), i]));

    const userIds = new Set();
    matches.forEach(m => {
      userIds.add(String(m.userAId));
      userIds.add(String(m.userBId));
    });
    const users = await User.find({ _id: { $in: [...userIds] } }).select('nickname avatarUrl').lean();
    const userMap = new Map(users.map(u => [String(u._id), u]));

    const flat = matches.map(m => {
      const chat = chatMap.get(String(m._id));
      const meIsA = String(m.userAId) === String(userId);
      const otherUserId = meIsA ? String(m.userBId) : String(m.userAId);
      const itemMineId = meIsA ? m.itemAId : m.itemBId;
      const itemTheirsId = meIsA ? m.itemBId : m.itemAId;

      const itemMine = itemMap.get(String(itemMineId));
      const itemTheirs = itemMap.get(String(itemTheirsId));

      let unread = 0;
      if (chat && chat.unreadCountByUser) {
        unread = chat.unreadCountByUser.get
          ? (chat.unreadCountByUser.get(String(userId)) || 0)
          : (chat.unreadCountByUser[String(userId)] || 0);
      }

      const lastActivityAt = chat?.lastMessageAt
        ? (chat.lastMessageAt > m.lastActivityAt ? chat.lastMessageAt : m.lastActivityAt)
        : m.lastActivityAt;

      return {
        matchId: m._id,
        status: m.status,
        lastActivityAt,
        unread,
        itemMine: itemMine ? {
          _id: itemMine._id,
          title: itemMine.title,
          imageUrl: itemMine.imageUrl
        } : null,
        itemTheirs: itemTheirs ? {
          _id: itemTheirs._id,
          title: itemTheirs.title,
          imageUrl: itemTheirs.imageUrl
        } : null,
        otherUser: {
          _id: otherUserId,
          nickname: userMap.get(otherUserId)?.nickname || 'Utente',
          avatarUrl: userMap.get(otherUserId)?.avatarUrl
        }
      };
    });

    if (!groupByUser) {
      return res.json(flat);
    }

    // Raggruppo
    const groupedMap = new Map();
    flat.forEach(m => {
      const key = m.otherUser._id;
      if (!groupedMap.has(key)) groupedMap.set(key, []);
      groupedMap.get(key).push(m);
    });

    const groups = [];
    groupedMap.forEach((arr, key) => {
      // ordina match interni per lastActivityAt desc
      arr.sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));
      const aggregateLast = arr[0].lastActivityAt;
      const unreadTotal = arr.reduce((s, x) => s + x.unread, 0);
      groups.push({
        otherUser: arr[0].otherUser,
        aggregate: {
          matchCount: arr.length,
          unreadTotal,
          lastActivityAt: aggregateLast
        },
        matches: arr.map(x => ({
          matchId: x.matchId,
            status: x.status,
            itemMine: x.itemMine,
            itemTheirs: x.itemTheirs,
            unread: x.unread,
            lastActivityAt: x.lastActivityAt
        }))
      });
    });

    groups.sort((a, b) => new Date(b.aggregate.lastActivityAt) - new Date(a.aggregate.lastActivityAt));
    res.json(groups);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;