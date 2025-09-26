import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import itemRoutes from './routes/items.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import interactionRoutes from './routes/interactions.js';
//import proposalsRoutes from './routes/proposals.js';
import matchRoutes from './routes/matches.js';
import chatRoutes from './routes/chat.js';

dotenv.config();

// Connect to MongoDB
connectDB(process.env.MONGO_URI);

const app = express();

app.use(cors()); // TODO restringere origin
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/interactions', interactionRoutes);
//app.use('/api/proposals', proposalsRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/chat', chatRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
