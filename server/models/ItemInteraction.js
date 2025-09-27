import mongoose from 'mongoose';

const itemInteractionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', index: true, required: true },
  action: { type: String, enum: ['like', 'dislike', 'skip'], required: true },
}, { timestamps: true });

// Una sola interazione per (user,item); l'azione può cambiare nel tempo
itemInteractionSchema.index({ user: 1, item: 1 }, { unique: true });

export default mongoose.model('ItemInteraction', itemInteractionSchema);