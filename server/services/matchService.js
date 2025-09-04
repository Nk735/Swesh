import Proposal from '../models/Proposal.js';
import Match from '../models/Match.js';
import Chat from '../models/Chat.js';

function canonicalUsers(u1, u2) {
  const a = String(u1);
  const b = String(u2);
  return a < b ? [a, b] : [b, a];
}

function canonicalItems(user1, user2, offeredOwnerId, offeredItemId, targetOwnerId, targetItemId) {
  const [ua, ub] = canonicalUsers(offeredOwnerId, targetOwnerId);
  let itemAId, itemBId;
  if (ua === String(offeredOwnerId)) {
    itemAId = offeredItemId;
    itemBId = targetItemId;
  } else {
    itemAId = targetItemId;
    itemBId = offeredItemId;
  }
  return { userAId: ua, userBId: ub, itemAId, itemBId };
}

export async function tryMatchAndCreate({ newProposal }) {
  const reciprocal = await Proposal.findOne({
    proposerUserId: newProposal.targetOwnerUserId,
    targetItemId: newProposal.offeredItemId,
    offeredItemId: newProposal.targetItemId,
    status: 'pending'
  });

  if (!reciprocal) {
    console.log('[proposal.pending]', {
      proposalId: newProposal._id.toString(),
      proposer: newProposal.proposerUserId.toString()
    });
    return { matched: false };
  }

  newProposal.status = 'matched';
  reciprocal.status = 'matched';
  await newProposal.save();
  await reciprocal.save();

  const { userAId, userBId, itemAId, itemBId } = canonicalItems(
    newProposal.proposerUserId,
    newProposal.targetOwnerUserId,
    newProposal.proposerUserId,
    newProposal.offeredItemId,
    newProposal.targetOwnerUserId,
    newProposal.targetItemId
  );

  let match;
  try {
    match = await Match.create({
      userAId,
      userBId,
      itemAId,
      itemBId,
      fromProposalIds: [newProposal._id, reciprocal._id],
      lastActivityAt: new Date()
    });
  } catch (err) {
    if (err.code === 11000) {
      match = await Match.findOne({ userAId, userBId, itemAId, itemBId });
    } else {
      throw err;
    }
  }

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

  console.log('[match.created]', {
    matchId: match._id.toString(),
    users: [userAId, userBId],
    items: [itemAId, itemBId]
  });

  return {
    matched: true,
    matchId: match._id,
    chatId: chat._id
  };
}