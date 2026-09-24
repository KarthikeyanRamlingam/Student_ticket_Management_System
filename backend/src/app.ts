import express from 'express';
import cors from 'cors';
import path from 'path';
import { ENV } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { sendError, sendSuccess } from './utils/response';

import authRoutes from './routes/auth.routes';
import ticketRoutes from './routes/ticket.routes';
import categoryRoutes from './routes/category.routes';
import staffRoutes from './routes/staff.routes';
import analyticsRoutes from './routes/analytics.routes';

const app = express();

// Security and CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  return sendSuccess(res, {
    status: 'healthy',
    system: 'CampusResolve API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 Catch-All Handler
app.use((req, res) => {
  return sendError(res, `Route '${req.method} ${req.originalUrl}' not found.`, 404);
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
