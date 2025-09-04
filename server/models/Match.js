import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  userAId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  userBId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  itemAId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
  itemBId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
  fromProposalIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', required: true }],
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active',
    index: true
  },
  lastActivityAt: { type: Date, default: Date.now, index: true },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' }
}, {
  timestamps: true
});

// Un match è unico per quadrupla utenti+item (canonical ordering)
matchSchema.index(
  { userAId: 1, userBId: 1, itemAId: 1, itemBId: 1 },
  { unique: true }
);

export default mongoose.model('Match', matchSchema);