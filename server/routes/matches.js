import express from 'express';
import { protect } from '../middleware/auth.js';
import Match from '../models/Match.js';
import Chat from '../models/Chat.js';
import Item from '../models/Item.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import mongoose from 'mongoose';
import { getIO } from '../utils/socketManager.js';

const router = express.Router();

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

      // Migliora lastActivityAt: scegli il più recente tra match e chat
      const lastActivityAt = chat?.lastMessageAt
        ? (chat.lastMessageAt > m.lastActivityAt ? chat.lastMessageAt : m.lastActivityAt)
        : m.lastActivityAt;

      // Nuovo campo tinderMetadata
      const tinderMetadata = m.matchType === 'tinder'
        ? {
            triggerUserId: String(userId), // Per ora chi fa la richiesta
            triggerItemId: meIsA ? itemTheirsId : itemMineId,
            matchedAt: m.createdAt
          }
        : undefined;

      return {
        matchId: m._id,
        status: m.status,
        matchType: m.matchType,
        tinderMetadata,
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
      arr.sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));
      const aggregateLast = arr[0].lastActivityAt;
      const unreadTotal = arr.reduce((s, x) => s + x.unread, 0);
      groups.push({
        otherUser: arr[0].otherUser,
        aggregate: {
          matchCount: arr.length,
          tinderMatches: arr.filter(x => x.matchType === 'tinder').length,
          proposalMatches: arr.filter(x => x.matchType === 'proposal').length,
          unreadTotal,
          lastActivityAt: aggregateLast
        },
        matches: arr.map(x => ({
          matchId: x.matchId,
          status: x.status,
          matchType: x.matchType,
          tinderMetadata: x.tinderMetadata,
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

// GET /api/matches/:matchId - get a single match by ID
router.get('/:matchId', protect, async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user._id;

    const match = await Match.findById(matchId).lean();
    if (!match) {
      return res.status(404).json({ message: 'Match non trovato' });
    }

    // Verify user is a participant
    if (String(match.userAId) !== String(userId) && String(match.userBId) !== String(userId)) {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    const meIsA = String(match.userAId) === String(userId);
    const otherUserId = meIsA ? String(match.userBId) : String(match.userAId);
    const itemMineId = meIsA ? match.itemAId : match.itemBId;
    const itemTheirsId = meIsA ? match.itemBId : match.itemAId;

    // Load items and user
    const [itemMine, itemTheirs, otherUser, chat] = await Promise.all([
      Item.findById(itemMineId).lean(),
      Item.findById(itemTheirsId).lean(),
      User.findById(otherUserId).select('nickname avatarUrl').lean(),
      Chat.findOne({ matchId: match._id }).lean()
    ]);

    let unread = 0;
    if (chat && chat.unreadCountByUser) {
      unread = chat.unreadCountByUser.get
        ? (chat.unreadCountByUser.get(String(userId)) || 0)
        : (chat.unreadCountByUser[String(userId)] || 0);
    }

    // Calculate confirmation status from the user's perspective
    const myConfirmed = meIsA 
      ? (match.confirmation?.userAConfirmed || false)
      : (match.confirmation?.userBConfirmed || false);
    const otherConfirmed = meIsA 
      ? (match.confirmation?.userBConfirmed || false)
      : (match.confirmation?.userAConfirmed || false);

    res.json({
      matchId: match._id,
      status: match.status,
      matchType: match.matchType,
      lastActivityAt: match.lastActivityAt,
      unread,
      itemMine: itemMine ? {
        _id: itemMine._id,
        title: itemMine.title,
        imageUrl: itemMine.imageUrl,
        description: itemMine.description
      } : null,
      itemTheirs: itemTheirs ? {
        _id: itemTheirs._id,
        title: itemTheirs.title,
        imageUrl: itemTheirs.imageUrl,
        description: itemTheirs.description
      } : null,
      otherUser: {
        _id: otherUserId,
        nickname: otherUser?.nickname || 'Utente',
        avatarUrl: otherUser?.avatarUrl
      },
      confirmation: {
        myConfirmed,
        otherConfirmed
      },
      ...(match.cancellation ? { cancellation: match.cancellation } : {}),
      ...(match.completedAt ? { completedAt: match.completedAt } : {})
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PATCH /api/matches/:matchId/confirm - confirm exchange
router.patch('/:matchId/confirm', protect, async (req, res) => {
  try {
    const { matchId } = req.params;
    const me = req.user;

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ message: 'Match non trovato' });

    // Verify user is a participant
    if (String(match.userAId) !== String(me._id) && String(match.userBId) !== String(me._id)) {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    // Can only confirm active matches
    if (match.status !== 'active') {
      return res.status(409).json({ message: 'Match non attivo, impossibile confermare' });
    }

    const meIsA = String(match.userAId) === String(me._id);

    // Initialize confirmation object if not exists
    if (!match.confirmation) {
      match.confirmation = { userAConfirmed: false, userBConfirmed: false };
    }

    // Update confirmation
    if (meIsA) {
      match.confirmation.userAConfirmed = true;
      match.confirmation.userAConfirmedAt = new Date();
    } else {
      match.confirmation.userBConfirmed = true;
      match.confirmation.userBConfirmedAt = new Date();
    }

    // Check if both confirmed
    if (match.confirmation.userAConfirmed && match.confirmation.userBConfirmed) {
      match.status = 'completed';
      match.completedAt = new Date();
    }

    match.lastActivityAt = new Date();
    await match.save();

    // Emit match_update to both users
    const io = getIO();
    if (io) {
      const otherUserId = meIsA ? String(match.userBId) : String(match.userAId);
      io.to(`user:${String(me._id)}`).emit('match_update', {
        type: 'match_confirmed',
        matchId: String(match._id)
      });
      io.to(`user:${otherUserId}`).emit('match_update', {
        type: 'match_confirmed',
        matchId: String(match._id)
      });
    }

    // Calculate confirmation status from the user's perspective
    const myConfirmed = meIsA 
      ? match.confirmation.userAConfirmed
      : match.confirmation.userBConfirmed;
    const otherConfirmed = meIsA 
      ? match.confirmation.userBConfirmed
      : match.confirmation.userAConfirmed;

    res.json({
      matchId: match._id,
      status: match.status,
      confirmation: {
        myConfirmed,
        otherConfirmed
      },
      lastActivityAt: match.lastActivityAt,
      ...(match.completedAt ? { completedAt: match.completedAt } : {})
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PATCH /api/matches/:matchId/cancel - annulla scambio
router.patch('/:matchId/cancel', protect, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { reason } = req.body || {};
    const me = req.user;

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ message: 'Match non trovato' });

    // Autorizzazione: devo essere uno dei due partecipanti
    if (String(match.userAId) !== String(me._id) && String(match.userBId) !== String(me._id)) {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    // Non annullabile se completato
    if (match.status === 'completed') {
      return res.status(409).json({ message: 'Scambio già completato, non annullabile' });
    }

    // Idempotenza: se già archiviato, ritorna info correnti
    if (match.status === 'archived') {
      return res.json({
        matchId: match._id,
        status: match.status,
        cancellation: match.cancellation,
        lastActivityAt: match.lastActivityAt
      });
    }

    // Aggiorna stato e metadati
    match.status = 'archived';
    match.cancellation = {
      by: me._id,
      at: new Date(),
      ...(reason ? { reason } : {})
    };
    match.lastActivityAt = new Date();

    // Garantisci la chat e invia un messaggio informativo
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
    }

    // Messaggio "di sistema" (semplice testo)
    const nickname = me.nickname || 'Utente';
    const sysMsg = await Message.create({
      chatId: chat._id,
      senderId: me._id, // possiamo usare il mittente come chi annulla
      content: `Scambio annullato da ${nickname}.`
    });

    // Aggiorna unread per l'altro utente
    const otherUserId = String(me._id) === String(match.userAId) ? String(match.userBId) : String(match.userAId);
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
    await match.save();

    // Emit match_update to both users
    const io = getIO();
    if (io) {
      io.to(`user:${String(me._id)}`).emit('match_update', {
        type: 'match_cancelled',
        matchId: String(match._id)
      });
      io.to(`user:${otherUserId}`).emit('match_update', {
        type: 'match_cancelled',
        matchId: String(match._id)
      });
    }

    return res.json({
      matchId: match._id,
      status: 'archived',
      cancellation: match.cancellation,
      lastActivityAt: match.lastActivityAt
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;