import Match from '../models/Match.js';
import Chat from '../models/Chat.js';
import ItemInteraction from '../models/ItemInteraction.js';
import Item from '../models/Item.js';

function canonicalUsers(u1, u2) {
  const a = String(u1);
  const b = String(u2);
  return a < b ? [a, b] : [b, a];
}

/**
 * Controlla se esiste un match reciproco dopo che un utente ha messo like
 * Logica Tinder: se A ha messo like a un item di B, e B ha messo like a qualsiasi item di A, è match!
 */
export async function checkForTinderMatch({ userId, likedItemId }) {
  try {
    // 1. Trova il proprietario dell'item che ho appena messo like
    const likedItem = await Item.findById(likedItemId);
    if (!likedItem) return { matched: false };
    
    const otherUserId = likedItem.owner;
    if (String(otherUserId) === String(userId)) return { matched: false };

    // 2. Trova tutti i miei item
    const myItems = await Item.find({ owner: userId }).select('_id');
    const myItemIds = myItems.map(item => item._id);

    // 3. Controlla se l'altro utente ha messo like a qualcuno dei miei item
    const reciprocalLike = await ItemInteraction.findOne({
      user: otherUserId,
      item: { $in: myItemIds },
      action: 'like'
    }).populate('item');

    if (!reciprocalLike) {
      console.log('[tinder.no_match]', {
        userId: userId.toString(),
        likedItemOwner: otherUserId.toString(),
        reason: 'no_reciprocal_like'
      });
      return { matched: false };
    }

    // 4. MATCH! Crea il match con gli item che si sono piaciuti reciprocamente
    const [userAId, userBId] = canonicalUsers(userId, otherUserId);
    
    // Determina quale item appartiene a quale utente in ordine canonico
    let itemAId, itemBId;
    if (userAId === String(userId)) {
      itemAId = reciprocalLike.item._id; // Il mio item che piace all'altro
      itemBId = likedItemId; // L'item dell'altro che piace a me
    } else {
      itemAId = likedItemId; // L'item dell'altro che piace a me  
      itemBId = reciprocalLike.item._id; // Il mio item che piace all'altro
    }

    // 5. Crea o trova il match esistente
    let match;
    try {
      match = await Match.create({
        userAId,
        userBId,
        itemAId,
        itemBId,
        fromProposalIds: [], // Vuoto per match Tinder-style
        lastActivityAt: new Date(),
        matchType: 'tinder' // Nuovo campo per distinguere i tipi di match
      });
    } catch (err) {
      if (err.code === 11000) {
        // Match già esistente, lo recupero
        match = await Match.findOne({ userAId, userBId, itemAId, itemBId });
        if (match) {
          console.log('[tinder.match_exists]', { matchId: match._id.toString() });
          return {
            matched: true,
            matchId: match._id,
            chatId: match.chatId,
            isExisting: true
          };
        }
      } else {
        throw err;
      }
    }

    // 6. Crea la chat associata
    let chat = await Chat.findOne({ matchId: match._id });
    if (!chat) {
      chat = await Chat.create({
        matchId: match._id,
        participants: [userAId, userBId],
        lastMessageAt: new Date(),
        unreadCountByUser: new Map([[userAId, 0], [userBId, 0]])
      });
    }

    if (!match.chatId) {
      match.chatId = chat._id;
      await match.save();
    }

    console.log('[tinder.match_created]', {
      matchId: match._id.toString(),
      users: [userAId, userBId],
      items: [itemAId, itemBId],
      trigger: `${userId} liked item ${likedItemId}`
    });

    return {
      matched: true,
      matchId: match._id,
      chatId: chat._id,
      isNew: true,
      matchedItems: {
        myItem: userAId === String(userId) ? itemAId : itemBId,
        theirItem: userAId === String(userId) ? itemBId : itemAId
      }
    };

  } catch (error) {
    console.error('[tinder.match_error]', error);
    return { matched: false, error: error.message };
  }
}

/**
 * Ottieni tutti i match dell'utente per un possibile sistema di "It's a Match!" screen
 */
export async function getUserMatches(userId) {
  const matches = await Match.find({
    $or: [{ userAId: userId }, { userBId: userId }]
  })
  .populate('itemAId', 'title imageUrl')
  .populate('itemBId', 'title imageUrl')
  .populate('userAId', 'nickname avatarUrl')  
  .populate('userBId', 'nickname avatarUrl')
  .sort({ createdAt: -1 });

  return matches.map(match => {
    const isUserA = String(match.userAId._id) === String(userId);
    return {
      matchId: match._id,
      otherUser: isUserA ? match.userBId : match.userAId,
      myItem: isUserA ? match.itemAId : match.itemBId,
      theirItem: isUserA ? match.itemBId : match.itemAId,
      createdAt: match.createdAt,
      chatId: match.chatId
    };
  });
}