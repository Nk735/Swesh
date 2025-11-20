import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import itemRoutes from './routes/items.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import interactionRoutes from './routes/interactions.js';
import matchRoutes from './routes/matches.js';
import chatRoutes from './routes/chat.js';
import avatarsRoutes from './routes/avatars.js';

// I MODELS PER SINCRONIZZARE GLI INDICI
import Match from './models/Match.js';
import Chat from './models/Chat.js';

dotenv.config();

// Connect to MongoDB
connectDB(process.env.MONGO_URI || process.env.MONGODB_URI).then(async () => {
  // Garantisce che l'indice unique su Match e gli indici di Chat siano aggiornati
  try {
    await Match.syncIndexes();
    await Chat.syncIndexes();
    console.log('Indexes synced: Match, Chat');
  } catch (e) {
    console.error('Index sync error', e);
  }
});
const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/chat', chatRoutes);

app.use('/api/avatars', avatarsRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log(`Listening on ${process.env.PORT || 3000}`);
});
