"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middlewares/errorHandler");
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// HTTP Request Logging
app.use((0, morgan_1.default)('dev'));
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
app.use('/api/orders', orderRoutes_1.default);
// Catch-all route for unmatched paths
app.use('*', (req, res, next) => {
    const err = new Error(`Can't find ${req.originalUrl} on this server!`);
    err.statusCode = 404;
    next(err);
});
// Global Error Handler
app.use(errorHandler_1.errorHandler);
// Start server
const server = app.listen(PORT, () => {
    logger_1.logger.info(`Backend server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
process.on('unhandledRejection', (err) => {
    logger_1.logger.error('UNHANDLED REJECTION! Shutting down...', err);
    server.close(() => {
        process.exit(1);
    });
});
