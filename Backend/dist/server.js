"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const orders_1 = __importDefault(require("./routes/orders"));
const employees_1 = __importDefault(require("./routes/employees"));
const inventory_1 = __importDefault(require("./routes/inventory"));
const system_1 = __importDefault(require("./routes/system"));
const employeeManagement_1 = __importDefault(require("./routes/employeeManagement"));
const inquiries_1 = __importDefault(require("./routes/inquiries"));
const wbs_1 = __importDefault(require("./routes/wbs"));
const mockData_1 = require("./data/mockData");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/dashboard', dashboard_1.default);
app.use('/api/orders', orders_1.default);
app.use('/api/employees', employees_1.default);
app.use('/api/inventory', inventory_1.default);
app.use('/api/system', system_1.default);
app.use('/api/employee-management', employeeManagement_1.default);
app.use('/api/inquiries', inquiries_1.default);
app.use('/api/wbs', wbs_1.default);
// Basic health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Skytech Program Management System API' });
});
// Start Server
app.listen(PORT, () => {
    console.log(`[Server] SkyTech PM Backend running on http://localhost:${PORT}`);
    (0, mockData_1.logSystemEvent)('API Server', `Express backend initialized on port ${PORT}`, 'info');
});
