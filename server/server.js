import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import itemRoutes from './routes/items.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();
connectDB(process.env.MONGO_URI);

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);

// 404 fallback
app.use((req, res, next) => {
  res.status(404);
  return res.json({ message: 'Risorsa non trovata' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
