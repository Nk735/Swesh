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
 * Helper function to create or get match and ensure chat exists
 */
async function createOrGetMatchAndChat(userAId, userBId, itemAId, itemBId) {
  let match;
  let isNew = false;
  
  try {
    match = await Match.create({
      userAId,
      userBId,
      itemAId,
      itemBId,
      lastActivityAt: new Date(),
      matchType: 'tinder'
    });
    isNew = true;
  } catch (err) {
    if (err.code === 11000) {
      // Match already exists, retrieve it
      match = await Match.findOne({ userAId, userBId, itemAId, itemBId });
      isNew = false;
    } else {
      throw err;
    }
  }

  if (!match) {
    throw new Error('Failed to create or find match');
  }

  // Ensure chat exists for this match
  let chat = await Chat.findOne({ matchId: match._id });
  if (!chat) {
    chat = await Chat.create({
      matchId: match._id,
      participants: [userAId, userBId],
      lastMessageAt: new Date(),
      unreadCountByUser: new Map([[userAId, 0], [userBId, 0]])
    });
  }

  // Link chat to match if not already linked
  if (!match.chatId) {
    match.chatId = chat._id;
    await match.save();
  }

  return { match, chat, isNew };
}

/**
 * Controlla se esiste un match reciproco dopo che un utente ha messo like
 * Logica Tinder: se A ha messo like a un item di B, e B ha messo like a qualsiasi item di A, è match!
 * Crea tutti i possibili match per ogni combinazione di item reciprocamente piaciuti.
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

    // 3. Trova tutti i "miei item" che l'altro utente ha messo like (set A)
    const myItemsLikedByOther = await ItemInteraction.find({
      user: otherUserId,
      item: { $in: myItemIds },
      action: 'like'
    }).populate('item');

    if (myItemsLikedByOther.length === 0) {
      console.log('[tinder.no_match]', {
        userId: userId.toString(),
        likedItemOwner: otherUserId.toString(),
        reason: 'no_reciprocal_like'
      });
      return { matched: false };
    }

    // 4. Trova tutti gli item dell'altro utente che ho messo like (set B)
    // Include l'item appena messo like + tutti gli altri già piaciuti
    const otherItems = await Item.find({ owner: otherUserId }).select('_id');
    const otherItemIds = otherItems.map(item => item._id);
    
    const theirItemsLikedByMe = await ItemInteraction.find({
      user: userId,
      item: { $in: otherItemIds },
      action: 'like'
    });

    // Aggiungi l'item appena messo like se non è già nella lista
    const likedItemIds = theirItemsLikedByMe.map(interaction => String(interaction.item));
    if (!likedItemIds.includes(String(likedItemId))) {
      theirItemsLikedByMe.push({ item: likedItemId });
    }

    // 5. Crea match per ogni combinazione A×B
    const [userAId, userBId] = canonicalUsers(userId, otherUserId);
    const createdMatches = [];
    let featuredMatch = null;

    for (const myItemLiked of myItemsLikedByOther) {
      for (const theirItemLiked of theirItemsLikedByMe) {
        const myItemId = myItemLiked.item._id;
        const theirItemId = theirItemLiked.item;

        // Determina quale item appartiene a quale utente in ordine canonico
        let itemAId, itemBId;
        if (userAId === String(userId)) {
          itemAId = myItemId; // Il mio item che piace all'altro
          itemBId = theirItemId; // L'item dell'altro che piace a me
        } else {
          itemAId = theirItemId; // L'item dell'altro che piace a me  
          itemBId = myItemId; // Il mio item che piace all'altro
        }

        try {
          const { match, chat, isNew } = await createOrGetMatchAndChat(
            userAId, userBId, itemAId, itemBId
          );

          createdMatches.push({ match, chat, isNew });

          // Feature the match that involves the item just liked
          if (String(theirItemId) === String(likedItemId)) {
            featuredMatch = {
              matched: true,
              matchId: match._id,
              chatId: chat._id,
              isNew: isNew,
              isExisting: !isNew,
              matchedItems: {
                myItem: userAId === String(userId) ? itemAId : itemBId,
                theirItem: userAId === String(userId) ? itemBId : itemAId
              }
            };
          }
        } catch (error) {
          console.error('[tinder.match_creation_error]', {
            userAId, userBId, itemAId, itemBId, error: error.message
          });
        }
      }
    }

    // 6. Log all created matches
    const newMatches = createdMatches.filter(m => m.isNew);
    const existingMatches = createdMatches.filter(m => !m.isNew);

    console.log('[tinder.matches_processed]', {
      userId: userId.toString(),
      otherUserId: otherUserId.toString(),
      trigger: `${userId} liked item ${likedItemId}`,
      totalMatches: createdMatches.length,
      newMatches: newMatches.length,
      existingMatches: existingMatches.length,
      featuredMatch: featuredMatch?.matchId?.toString()
    });

    // 7. Return featured match or first new match if no featured match found
    if (featuredMatch) {
      return featuredMatch;
    } else if (newMatches.length > 0) {
      const firstNewMatch = newMatches[0];
      return {
        matched: true,
        matchId: firstNewMatch.match._id,
        chatId: firstNewMatch.chat._id,
        isNew: true,
        matchedItems: {
          myItem: userAId === String(userId) ? firstNewMatch.match.itemAId : firstNewMatch.match.itemBId,
          theirItem: userAId === String(userId) ? firstNewMatch.match.itemBId : firstNewMatch.match.itemAId
        }
      };
    } else if (createdMatches.length > 0) {
      // All matches already existed
      const firstMatch = createdMatches[0];
      return {
        matched: true,
        matchId: firstMatch.match._id,
        chatId: firstMatch.chat._id,
        isExisting: true,
        matchedItems: {
          myItem: userAId === String(userId) ? firstMatch.match.itemAId : firstMatch.match.itemBId,
          theirItem: userAId === String(userId) ? firstMatch.match.itemBId : firstMatch.match.itemAId
        }
      };
    }

    return { matched: false };

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