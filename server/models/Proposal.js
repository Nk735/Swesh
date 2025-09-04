import mongoose from 'mongoose';

const proposalSchema = new mongoose.Schema({
  proposerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  targetOwnerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  targetItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
  offeredItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
  status: {
    type: String,
    enum: ['pending', 'matched', 'cancelled', 'expired'],
    default: 'pending',
    index: true
  },
  reciprocityKey: { type: String } // debug / tracing
}, {
  timestamps: true
});

// Evita duplicati identici in stato pending (facilitando UX)
proposalSchema.index(
  { proposerUserId: 1, targetItemId: 1, offeredItemId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

export default mongoose.model('Proposal', proposalSchema);