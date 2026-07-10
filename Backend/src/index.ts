import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { logger } from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';
import orderRoutes from './routes/orderRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logging
app.use(morgan('dev'));

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Skytech Program Management System API is running smoothly',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Router Stubs for Core Modules
app.get('/api/dashboard', (req, res) => {
  res.json({
    message: 'Dashboard data stub',
    activeOrders: 18,
    pendingTasks: 34,
    delayedJobs: 3,
  });
});

app.use('/api/orders', orderRoutes);

// Catch-all route for unmatched paths
app.use('*', (req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server!`) as any;
  err.statusCode = 404;
  next(err);
});

// Global Error Handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Backend server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err: any) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', err);
  server.close(() => {
    process.exit(1);
  });
});
