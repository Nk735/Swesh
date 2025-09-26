import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  imageUrl: { type: String, required: true },
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
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likesCount: { type: Number, default: 0 },
  likesList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, {
  timestamps: true,
});

// Middleware per mantenere likesCount aggiornato
itemSchema.pre("save", function (next) {
  this.likesCount = this.likesList.length;
  next();
});

const Item = mongoose.model('Item', itemSchema);
export default Item;
