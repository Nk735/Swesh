import mongoose from 'mongoose';

export const connectDB = async (uri) => {
  if (!uri) {
    console.error('MONGO_URI non definita');
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000, // Timeout dopo 5 secondi
    });
    console.log(`MongoDB connesso: ${conn.connection.host}`);
  } catch (err) {
    console.error('Errore connessione MongoDB:', err.message);
    // In development, non bloccare il server se MongoDB non è disponibile
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Continuando senza MongoDB per development...');
      return;
    }
    process.exit(1);
  }
};