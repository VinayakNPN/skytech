import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import employeesRouter from './routes/employees';
import inventoryRouter from './routes/inventory';
import systemRouter from './routes/system';
import employeeManagementRouter from './routes/employeeManagement';
import inquiriesRouter from './routes/inquiries';
import wbsRouter from './routes/wbs';
import projectTeamsRouter from './routes/projectTeams';
import { logSystemEvent } from './data/mockData';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import authRoutes from './routes/authRoutes';
import { authenticate } from './middleware/authenticate';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:3000',
  'https://skytech.onrender.com',
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [])
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.trim();
    if (
      allowedOrigins.some(o => o.trim() === cleanOrigin || o.trim() === '*') ||
      cleanOrigin.endsWith('.vercel.app') ||
      cleanOrigin.endsWith('.onrender.com')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Public Routes
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);

// Protected API Routes
app.use('/api', authenticate);
app.use('/api/employees', employeesRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/system', systemRouter);
app.use('/api/employee-management', employeeManagementRouter);
app.use('/api/inquiries', inquiriesRouter);
app.use('/api/wbs', wbsRouter);
app.use('/api/projects', projectTeamsRouter);
app.use('/api/inquiries', projectTeamsRouter);

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Skytech Program Management System API' });
});

// 404 & Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Start Server
const server = app.listen(PORT, () => {
  logger.info(`[Server] SkyTech PM Backend running on http://localhost:${PORT}`);
  logSystemEvent('API Server', `Express backend initialized on port ${PORT}`, 'info');
});

server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`[Server Error] Port ${PORT} is already in use. Clean up the process using port ${PORT} or set PORT in environment variables.`);
  } else {
    logger.error(`[Server Error] ${error.message}`);
  }
});

