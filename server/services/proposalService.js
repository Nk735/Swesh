import Proposal from '../models/Proposal.js';
import Item from '../models/Item.js';

export async function createPendingProposal({ proposerUserId, targetItemId, offeredItemId }) {
  if (targetItemId === offeredItemId) {
    const e = new Error('Non puoi proporre lo stesso item');
    e.statusCode = 400;
    throw e;
  }
  const targetItem = await Item.findById(targetItemId);
  const offeredItem = await Item.findById(offeredItemId);

  if (!targetItem) {
    const e = new Error('Item target non trovato');
    e.statusCode = 404;
    throw e;
  }
  if (!offeredItem) {
    const e = new Error('Item offerto non trovato');
    e.statusCode = 404;
    throw e;
  }
  if (String(targetItem.owner) === String(proposerUserId)) {
    const e = new Error('Non puoi proporre scambio sul tuo stesso item');
    e.statusCode = 400;
    throw e;
  }
  if (String(offeredItem.owner) !== String(proposerUserId)) {
    const e = new Error('L\'item offerto non è tuo');
    e.statusCode = 400;
    throw e;
  }

  const reciprocityKey = `${proposerUserId}:${offeredItemId}->${targetItem.owner}:${targetItemId}`;

  try {
    const proposal = await Proposal.create({
      proposerUserId,
      targetOwnerUserId: targetItem.owner,
      targetItemId,
      offeredItemId,
      status: 'pending',
      reciprocityKey
    });
    return proposal;
  } catch (err) {
    // Gestione duplicato pending
    if (err.code === 11000) {
      const e = new Error('Hai già una proposta identica in sospeso');
      e.statusCode = 409;
      throw e;
    }
    throw err;
  }
}