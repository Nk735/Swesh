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

// I MODELS PER SINCRONIZZARE GLI INDICI
import Match from './models/Match.js';
import Chat from './models/Chat.js';

dotenv.config();

// Connessione MongoDB (fallback MONGO_URI || MONGODB_URI)
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

// Configurazione CORS
console.log(`[Server] Startup - NODE_ENV: ${process.env.NODE_ENV}`);

const corsOptions = {
  origin: true, // Accetta automaticamente qualsiasi origine (localhost, app, ecc.)
  credentials: true, // Permette l'invio di cookie/header auth
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};

{/*const corsOptions = {
  origin: (origin, callback) => {
    // Consenti richieste senza origin (es. Postman, app mobile native pure)
    if (!origin) return callback(null, true);

    const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean);
    
    // Controlli di sicurezza
    const isDev = process.env.NODE_ENV !== 'production';
    // Permetti sempre localhost/loopback per sviluppo locale (anche se in container production)
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('10.0.2.2');
    const isWildcard = allowedOrigins.includes('*') || allowedOrigins.length === 0;

    if (isDev || isWildcard || isLocalhost || allowedOrigins.includes(origin)) {
      return callback(null, true); // Accesso consentito
    }

    console.error(`[CORS] Blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
};*/}

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/chat', chatRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log(`Listening on ${process.env.PORT || 3000}`);
});
