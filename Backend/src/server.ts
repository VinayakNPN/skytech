import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dashboardRouter from './routes/dashboard';
import ordersRouter from './routes/orders';
import employeesRouter from './routes/employees';
import inventoryRouter from './routes/inventory';
import systemRouter from './routes/system';
import employeeManagementRouter from './routes/employeeManagement';
import inquiriesRouter from './routes/inquiries';
import wbsRouter from './routes/wbs';
import { logSystemEvent } from './data/mockData';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/dashboard', dashboardRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/system', systemRouter);
app.use('/api/employee-management', employeeManagementRouter);
app.use('/api/inquiries', inquiriesRouter);
app.use('/api/wbs', wbsRouter);

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Skytech Program Management System API' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[Server] SkyTech PM Backend running on http://localhost:${PORT}`);
  logSystemEvent('API Server', `Express backend initialized on port ${PORT}`, 'info');
});
