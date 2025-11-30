import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  nickname: {
    type: String,
    required: [true, 'Nickname is required'],
    trim: true,
  },
  avatarKey: {
    type: String,
  },
  likedItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
  }],
  dislikedItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
  }],
  completedExchangesCount: { type: Number, default: 0 },
  age: { 
    type: Number, 
    min: 16,
    max: 120 
  },
  gender: { 
    type: String, 
    enum: ['male', 'female', 'prefer_not_to_say']
  },
  feedPreferences: {
    showGender: { 
      type: String, 
      enum: ['male', 'female', 'all'],
      default: null
    }
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    }
  },
  onboarding: {
    completed: { type: Boolean, default: false },
    completedAt: { type: Date }
  }
}, {
  timestamps: true,
});

// Pre-save hook: hash password if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Methods to handle likes and dislikes
userSchema.methods.likeItem = function (itemId) {
  if (!this.likedItems.includes(itemId)) {
    this.likedItems.push(itemId);
    this.dislikedItems = this.dislikedItems.filter(id => id.toString() !== itemId.toString());
  }
  return this.save();
};

userSchema.methods.dislikeItem = function (itemId) {
  if (!this.dislikedItems.includes(itemId)) {
    this.dislikedItems.push(itemId);
    this.likedItems = this.likedItems.filter(id => id.toString() !== itemId.toString());
  }
  return this.save();
};

const User = mongoose.model('User', userSchema);
export default User;