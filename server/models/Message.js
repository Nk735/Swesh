import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  content: { type: String, required: true, trim: true, maxlength: 2000 },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isSystemMessage: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Custom validation: senderId is required unless it's a system message
messageSchema.pre('validate', function(next) {
  if (!this.isSystemMessage && !this.senderId) {
    next(new Error('senderId is required for non-system messages'));
  } else {
    next();
  }
});

messageSchema.index({ chatId: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);