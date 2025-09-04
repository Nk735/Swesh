import mongoose from 'mongoose';

const rateCounterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  dateKey: { type: String, required: true, index: true },
  proposalsCount: { type: Number, default: 0 }
}, { timestamps: true });

rateCounterSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

export default mongoose.model('RateCounter', rateCounterSchema);