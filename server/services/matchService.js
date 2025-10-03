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
 * Idempotent upsert del Match e garanzia della Chat (anch'essa unica per matchId).
 * Usa updateOne + $setOnInsert per ridurre le finestre di race.
 */
async function createOrGetMatchAndChat(userAId, userBId, itemAId, itemBId) {
  const filter = { userAId, userBId, itemAId, itemBId };
  const insertDoc = {
    userAId,
    userBId,
    itemAId,
    itemBId,
    lastActivityAt: new Date(),
    matchType: 'tinder',
  };

  const res = await Match.updateOne(filter, { $setOnInsert: insertDoc }, { upsert: true });
  const isNew = !!(res && (res.upsertedCount === 1 || res.upsertedId));
  const match = await Match.findOne(filter);
  if (!match) throw new Error('Failed to create or find match');

  // Chat unica per match
  let chat = await Chat.findOne({ matchId: match._id });
  if (!chat) {
    try {
      chat = await Chat.create({
        matchId: match._id,
        participants: [userAId, userBId],
        lastMessageAt: new Date(),
        unreadCountByUser: new Map([[String(userAId), 0], [String(userBId), 0]])
      });
    } catch (e) {
      // Se due processi ci provano in parallelo, riprendi quella creata dall'altro
      chat = await Chat.findOne({ matchId: match._id });
    }
  }

  if (!match.chatId) {
    match.chatId = chat._id;
    await match.save();
  }

  return { match, chat, isNew };
}

/**
 * Crea tutte le combinazioni di match quando c'è reciprocità.
 */
export async function checkForTinderMatch({ userId, likedItemId }) {
  try {
    // 1) Item appena likato e proprietario
    const likedItem = await Item.findById(likedItemId);
    if (!likedItem) return { matched: false };

    const otherUserId = likedItem.owner;
    if (String(otherUserId) === String(userId)) return { matched: false };

    // 2) Miei item
    const myItems = await Item.find({ owner: userId }).select('_id');
    const myItemIds = myItems.map(i => i._id);

    // 3) Miei item che l'altro ha likato (A)
    const myItemsLikedByOther = await ItemInteraction.find({
      user: otherUserId,
      item: { $in: myItemIds },
      action: 'like'
    }).populate('item');

    if (!myItemsLikedByOther.length) {
      return { matched: false };
    }

    // 4) Item dell'altro che ho likato io (B) + includi quello appena likato
    const otherItems = await Item.find({ owner: otherUserId }).select('_id');
    const otherItemIds = otherItems.map(i => i._id);

    const theirItemsILikedDocs = await ItemInteraction.find({
      user: userId,
      item: { $in: otherItemIds },
      action: 'like'
    }).select('item');

    const theirItemsILikedSet = new Set(theirItemsILikedDocs.map(d => String(d.item)));
    theirItemsILikedSet.add(String(likedItemId));
    const theirItemsILiked = Array.from(theirItemsILikedSet);

    // 5) Prodotto cartesiano A × B con ordinamento canonico utenti
    const [userAId, userBId] = canonicalUsers(userId, otherUserId);
    let featuredMatch = null;
    const created = [];

    for (const myItemLiked of myItemsLikedByOther) {
      const myItemId = myItemLiked.item._id;
      for (const theirItemId of theirItemsILiked) {
        let itemAId, itemBId;
        if (userAId === String(userId)) {
          itemAId = myItemId;
          itemBId = theirItemId;
        } else {
          itemAId = theirItemId;
          itemBId = myItemId;
        }

        const { match, chat, isNew } = await createOrGetMatchAndChat(userAId, userBId, itemAId, itemBId);
        created.push({ match, isNew });

        // Evidenzia il match che coinvolge l'item appena likato
        if (!featuredMatch && String(theirItemId) === String(likedItemId)) {
          featuredMatch = {
            matched: true,
            matchId: match._id,
            chatId: chat._id,
            isNew,
            isExisting: !isNew,
            matchedItems: {
              myItem: userAId === String(userId) ? itemAId : itemBId,
              theirItem: userAId === String(userId) ? itemBId : itemAId
            }
          };
        }
      }
    }

    if (featuredMatch) return featuredMatch;
    if (created.length) {
      const first = created[0];
      return {
        matched: true,
        matchId: first.match._id,
        chatId: first.match.chatId,
        isNew: first.isNew,
        isExisting: !first.isNew
      };
    }

    return { matched: false };
  } catch (error) {
    console.error('[tinder.match_error]', error);
    return { matched: false, error: error.message };
  }
}

/**
 * Ottieni tutti i match dell'utente (helper non usato direttamente nelle routes qui).
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