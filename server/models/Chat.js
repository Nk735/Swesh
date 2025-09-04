import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', unique: true, required: true, index: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessageAt: { type: Date, default: Date.now, index: true },
  unreadCountByUser: { type: Map, of: Number, default: {} }
}, {
  timestamps: true
});

chatSchema.index({ participants: 1 });

export default mongoose.model('Chat', chatSchema);