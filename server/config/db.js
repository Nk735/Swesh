import mongoose from 'mongoose';

export const connectDB = async (uri) => {
  if (!uri) {
    console.error('MONGO_URI non definita');
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 30000, // 30s per trovare un server
      socketTimeoutMS: 45000,          // Evita chiusura prematura su operazioni lente
    });
    console.log(`MongoDB connesso: ${conn.connection.host}`);
  } catch (err) {
    console.error('Errore connessione MongoDB:', err.message);
    // In sviluppo puoi decidere se continuare; manteniamo comportamento precedente.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Continuando senza MongoDB per development...');
      return;
    }
    process.exit(1);
  }
};