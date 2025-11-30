import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  imageUrl: { type: String, required: true },
  images: [{ type: String }],
  condition: {
    type: String,
    enum: ["new", "excellent", "good"],
    default: "good",
  },
  isAvailable: { type: Boolean, default: true, index: true },
  size: {
      type: String,
      enum: ["XS", "S", "M", "L", "XL", "XXL"],
      default: "M",
    },
  category: {
      type: String,
      enum: ["shirt", "pants", "shoes", "jacket", "accessory", "other"],
      default: "other",
    },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  likesCount: { type: Number, default: 0 },
  likesList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  exchangedAt: { type: Date },
  exchangedInMatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
  exchangedWith: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
});

// Compound index for common feed queries (owner + isAvailable)
itemSchema.index({ owner: 1, isAvailable: 1 });

// Middleware per mantenere likesCount aggiornato e sincronizzare imageUrl con images[0]
itemSchema.pre("save", function (next) {
  this.likesCount = this.likesList.length;
  
  // Se images[] è presente e non vuoto, setta imageUrl = images[0] per compatibilità
  if (this.images && this.images.length > 0 && !this.imageUrl) {
    this.imageUrl = this.images[0];
  }
  
  next();
});

const Item = mongoose.model('Item', itemSchema);
export default Item;
