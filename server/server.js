import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import clothesRoutes from './routes/clothesRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';

// Initialize environment variables
dotenv.config();

// Connect to MongoDB
connectDB(process.env.MONGO_URI);

// Initialize Express app
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());           // Body parser for JSON
app.use(morgan('dev'));            // HTTP request logger

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/clothes', clothesRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/chat', chatRoutes);

// Error handler (should be last middleware)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
