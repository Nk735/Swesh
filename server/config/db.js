import mongoose from 'mongoose';

export const connectDB = async (mongoUri) => {
  try {
    if (!mongoUri) throw new Error('Missing MongoDB connection string');
    const conn = await mongoose.connect(mongoUri, {
      autoIndex: true,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    // In development, continue without exiting to allow testing other functionality
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};