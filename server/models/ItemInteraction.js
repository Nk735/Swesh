import mongoose from 'mongoose';

const itemInteractionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    required: true,
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    index: true,
    required: true,
  },
  action: {
    type: String,
    enum: ['like', 'dislike', 'skip'],
    required: true,
  },
}, {
  timestamps: true, // createdAt + updatedAt
});

// Un utente può avere al massimo una interaction “attiva” per item
itemInteractionSchema.index({ user: 1, item: 1 }, { unique: true });

const ItemInteraction = mongoose.model('ItemInteraction', itemInteractionSchema);
export default ItemInteraction;