import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
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
import Message from './models/Message.js';
import User from './models/User.js';

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

// Create HTTP server and Socket.io instance
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions,
  pingTimeout: 60000,
});

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  const userId = socket.user._id.toString();
  console.log(`[Socket] User connected: ${userId}`);

  // Join user's personal room for receiving messages
  socket.join(`user:${userId}`);

  // Join a chat room
  socket.on('join_chat', async (matchId) => {
    try {
      const match = await Match.findById(matchId);
      if (!match) return;
      // Verify user is participant
      if (String(match.userAId) !== userId && String(match.userBId) !== userId) {
        return;
      }
      socket.join(`chat:${matchId}`);
      console.log(`[Socket] User ${userId} joined chat:${matchId}`);
    } catch (err) {
      console.error('[Socket] join_chat error:', err.message);
    }
  });

  // Leave a chat room
  socket.on('leave_chat', (matchId) => {
    socket.leave(`chat:${matchId}`);
    console.log(`[Socket] User ${userId} left chat:${matchId}`);
  });

  // Handle new message
  socket.on('send_message', async ({ matchId, content }) => {
    try {
      if (!content || !content.trim()) return;

      const match = await Match.findById(matchId);
      if (!match) return;
      // Verify user is participant
      if (String(match.userAId) !== userId && String(match.userBId) !== userId) {
        return;
      }
      if (match.status !== 'active') return;

      // Get or create chat
      let chat = await Chat.findOne({ matchId: match._id });
      if (!chat) {
        chat = await Chat.create({
          matchId: match._id,
          participants: [match.userAId, match.userBId],
          lastMessageAt: new Date(),
          unreadCountByUser: new Map([
            [String(match.userAId), 0],
            [String(match.userBId), 0]
          ])
        });
        match.chatId = chat._id;
        await match.save();
      }

      // Create message
      const msg = await Message.create({
        chatId: chat._id,
        senderId: userId,
        content: content.trim(),
        readBy: [userId]
      });

      // Update chat and match
      const otherUserId = userId === String(match.userAId) ? String(match.userBId) : String(match.userAId);
      chat.lastMessageAt = new Date();
      const currentUnread = chat.unreadCountByUser.get
        ? (chat.unreadCountByUser.get(otherUserId) || 0)
        : (chat.unreadCountByUser[otherUserId] || 0);
      if (chat.unreadCountByUser.set) {
        chat.unreadCountByUser.set(otherUserId, currentUnread + 1);
      } else {
        chat.unreadCountByUser[otherUserId] = currentUnread + 1;
      }
      await chat.save();
      match.lastActivityAt = chat.lastMessageAt;
      await match.save();

      const messageData = {
        _id: msg._id,
        content: msg.content,
        senderId: msg.senderId,
        createdAt: msg.createdAt,
        read: false
      };

      // Emit to chat room
      io.to(`chat:${matchId}`).emit('new_message', { matchId, message: messageData });
      // Also emit to the other user's personal room in case they're not in the chat
      io.to(`user:${otherUserId}`).emit('new_message_notification', { matchId, message: messageData });

    } catch (err) {
      console.error('[Socket] send_message error:', err.message);
    }
  });

  // Handle typing indicator
  socket.on('typing_start', async (matchId) => {
    try {
      const match = await Match.findById(matchId);
      if (!match) return;
      if (String(match.userAId) !== userId && String(match.userBId) !== userId) return;
      
      socket.to(`chat:${matchId}`).emit('user_typing', { matchId, userId, isTyping: true });
    } catch (err) {
      console.error('[Socket] typing_start error:', err.message);
    }
  });

  socket.on('typing_stop', async (matchId) => {
    try {
      const match = await Match.findById(matchId);
      if (!match) return;
      if (String(match.userAId) !== userId && String(match.userBId) !== userId) return;
      
      socket.to(`chat:${matchId}`).emit('user_typing', { matchId, userId, isTyping: false });
    } catch (err) {
      console.error('[Socket] typing_stop error:', err.message);
    }
  });

  // Handle exchange confirmation
  socket.on('confirm_exchange', async (matchId) => {
    try {
      const match = await Match.findById(matchId);
      if (!match) return;
      if (String(match.userAId) !== userId && String(match.userBId) !== userId) return;
      if (match.status !== 'active') return;

      // Initialize confirmation object if not exists
      if (!match.confirmation) {
        match.confirmation = { userAConfirmed: false, userBConfirmed: false };
      }

      const isUserA = String(match.userAId) === userId;
      if (isUserA) {
        match.confirmation.userAConfirmed = true;
        match.confirmation.userAConfirmedAt = new Date();
      } else {
        match.confirmation.userBConfirmed = true;
        match.confirmation.userBConfirmedAt = new Date();
      }

      // Check if both confirmed
      if (match.confirmation.userAConfirmed && match.confirmation.userBConfirmed) {
        match.status = 'completed';
        match.completedAt = new Date();
      }

      match.lastActivityAt = new Date();
      await match.save();

      // Emit update to both users
      io.to(`chat:${matchId}`).emit('exchange_status', {
        matchId,
        status: match.status,
        confirmation: match.confirmation
      });

    } catch (err) {
      console.error('[Socket] confirm_exchange error:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] User disconnected: ${userId}`);
  });
});

// Export io for use in routes if needed
export { io };

httpServer.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log(`Listening on ${process.env.PORT || 3000}`);
});
