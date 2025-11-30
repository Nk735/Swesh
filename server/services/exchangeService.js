import Match from '../models/Match.js';
import Item from '../models/Item.js';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { getIO } from '../utils/socketManager.js';

/**
 * Helper to get/set unread count regardless of Map vs Object implementation
 */
function getUnreadCount(chat, userId) {
  const key = String(userId);
  if (chat.unreadCountByUser?.get) {
    return chat.unreadCountByUser.get(key) || 0;
  }
  return chat.unreadCountByUser?.[key] || 0;
}

function setUnreadCount(chat, userId, count) {
  const key = String(userId);
  if (chat.unreadCountByUser?.set) {
    chat.unreadCountByUser.set(key, count);
  } else if (chat.unreadCountByUser) {
    chat.unreadCountByUser[key] = count;
  }
}

/**
 * Handles all post-completion logic for an exchange
 * @param {Object} match - The completed match document
 */
export async function handleExchangeCompletion(match) {
  const io = getIO();
  const matchId = match._id;
  const userAId = match.userAId;
  const userBId = match.userBId;
  const itemAId = match.itemAId;
  const itemBId = match.itemBId;

  // 1. Hide items (mark as not available)
  await Item.updateOne(
    { _id: itemAId },
    {
      isAvailable: false,
      exchangedAt: new Date(),
      exchangedInMatchId: matchId,
      exchangedWith: userBId
    }
  );
  
  await Item.updateOne(
    { _id: itemBId },
    {
      isAvailable: false,
      exchangedAt: new Date(),
      exchangedInMatchId: matchId,
      exchangedWith: userAId
    }
  );

  // 2. Increment completed exchanges count for both users
  await User.updateMany(
    { _id: { $in: [userAId, userBId] } },
    { $inc: { completedExchangesCount: 1 } }
  );

  // 3. Find and archive related matches (other matches involving same items)
  const relatedMatches = await Match.find({
    _id: { $ne: matchId },
    status: 'active',
    $or: [
      { itemAId: { $in: [itemAId, itemBId] } },
      { itemBId: { $in: [itemAId, itemBId] } }
    ]
  });

  // Get item titles for system messages
  const items = await Item.find({ _id: { $in: [itemAId, itemBId] } }).lean();
  const itemTitles = {};
  items.forEach(item => {
    itemTitles[String(item._id)] = item.title;
  });

  // 4. Archive each related match and send system messages
  for (const relatedMatch of relatedMatches) {
    relatedMatch.status = 'archived';
    relatedMatch.archival = {
      reason: 'item_exchanged',
      relatedMatchId: matchId,
      at: new Date()
    };
    relatedMatch.lastActivityAt = new Date();
    await relatedMatch.save();

    // Find which item was involved in this match
    let exchangedItemTitle = '';
    if (String(relatedMatch.itemAId) === String(itemAId) || String(relatedMatch.itemAId) === String(itemBId)) {
      exchangedItemTitle = itemTitles[String(relatedMatch.itemAId)] || 'oggetto';
    } else {
      exchangedItemTitle = itemTitles[String(relatedMatch.itemBId)] || 'oggetto';
    }

    // Create or find chat for this match
    let chat = await Chat.findOne({ matchId: relatedMatch._id });
    if (!chat) {
      chat = await Chat.create({
        matchId: relatedMatch._id,
        participants: [relatedMatch.userAId, relatedMatch.userBId],
        lastMessageAt: new Date(),
        unreadCountByUser: new Map([
          [String(relatedMatch.userAId), 0],
          [String(relatedMatch.userBId), 0]
        ])
      });
    }

    // Create system message (no senderId for system messages)
    await Message.create({
      chatId: chat._id,
      content: `L'oggetto "${exchangedItemTitle}" è stato scambiato con un altro utente. Questa chat è ora in sola lettura.`,
      isSystemMessage: true
    });

    // Update unread counts for both users in the related match
    chat.lastMessageAt = new Date();
    setUnreadCount(chat, relatedMatch.userAId, getUnreadCount(chat, relatedMatch.userAId) + 1);
    setUnreadCount(chat, relatedMatch.userBId, getUnreadCount(chat, relatedMatch.userBId) + 1);
    await chat.save();

    // 5. Notify users via Socket.io
    if (io) {
      io.to(`user:${String(relatedMatch.userAId)}`).emit('match_archived', {
        matchId: String(relatedMatch._id),
        reason: 'item_exchanged',
        relatedMatchId: String(matchId),
        itemTitle: exchangedItemTitle
      });
      io.to(`user:${String(relatedMatch.userBId)}`).emit('match_archived', {
        matchId: String(relatedMatch._id),
        reason: 'item_exchanged',
        relatedMatchId: String(matchId),
        itemTitle: exchangedItemTitle
      });
    }
  }

  // 6. Emit exchange_completed to both users of the completed exchange
  if (io) {
    // Load user nicknames for the event
    const users = await User.find({ _id: { $in: [userAId, userBId] } }).select('nickname').lean();
    const userNicknames = {};
    users.forEach(u => {
      userNicknames[String(u._id)] = u.nickname;
    });

    // For userA
    io.to(`user:${String(userAId)}`).emit('exchange_completed', {
      matchId: String(matchId),
      myItemTitle: itemTitles[String(itemAId)] || 'Il tuo oggetto',
      theirItemTitle: itemTitles[String(itemBId)] || 'Oggetto loro',
      otherUserNickname: userNicknames[String(userBId)] || 'Utente'
    });

    // For userB
    io.to(`user:${String(userBId)}`).emit('exchange_completed', {
      matchId: String(matchId),
      myItemTitle: itemTitles[String(itemBId)] || 'Il tuo oggetto',
      theirItemTitle: itemTitles[String(itemAId)] || 'Oggetto loro',
      otherUserNickname: userNicknames[String(userAId)] || 'Utente'
    });
  }

  return {
    archivedMatchesCount: relatedMatches.length,
    itemsHidden: 2,
    usersUpdated: 2
  };
}

export default { handleExchangeCompletion };
