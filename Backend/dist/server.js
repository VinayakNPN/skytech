"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const employees_1 = __importDefault(require("./routes/employees"));
const inventory_1 = __importDefault(require("./routes/inventory"));
const system_1 = __importDefault(require("./routes/system"));
const employeeManagement_1 = __importDefault(require("./routes/employeeManagement"));
const inquiries_1 = __importDefault(require("./routes/inquiries"));
const wbs_1 = __importDefault(require("./routes/wbs"));
const projectTeams_1 = __importDefault(require("./routes/projectTeams"));
const mockData_1 = require("./data/mockData");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const notFound_1 = require("./middleware/notFound");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const authenticate_1 = require("./middleware/authenticate");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, helmet_1.default)());
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    'https://skytech.onrender.com',
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
    ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [])
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        const cleanOrigin = origin.trim();
        if (allowedOrigins.some(o => o.trim() === cleanOrigin || o.trim() === '*') ||
            cleanOrigin.endsWith('.vercel.app') ||
            cleanOrigin.endsWith('.onrender.com')) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express_1.default.json());
// Public Routes
app.use('/auth', authRoutes_1.default);
app.use('/api/auth', authRoutes_1.default);
// Protected API Routes
app.use('/api', authenticate_1.authenticate);
app.use('/api/employees', employees_1.default);
app.use('/api/inventory', inventory_1.default);
app.use('/api/system', system_1.default);
app.use('/api/employee-management', employeeManagement_1.default);
app.use('/api/inquiries', inquiries_1.default);
app.use('/api/wbs', wbs_1.default);
app.use('/api/projects', projectTeams_1.default);
app.use('/api/inquiries', projectTeams_1.default);
// Basic health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Skytech Program Management System API' });
});
// 404 & Error Handling Middleware
app.use(notFound_1.notFound);
app.use(errorHandler_1.errorHandler);
// Start Server
app.listen(PORT, () => {
    logger_1.logger.info(`[Server] SkyTech PM Backend running on http://localhost:${PORT}`);
    (0, mockData_1.logSystemEvent)('API Server', `Express backend initialized on port ${PORT}`, 'info');
});
