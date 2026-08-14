"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../db/prisma");
const mockData_1 = require("../data/mockData");
const validators_1 = require("../validators");
const authorize_1 = require("../middleware/authorize");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = (0, express_1.Router)();
// GET all employees from Database
router.get('/', (0, authorize_1.authorize)('employees', 'read'), async (req, res) => {
    try {
        const employees = await prisma_1.prisma.employee.findMany({
            orderBy: { empCode: 'asc' }
        });
        res.json(employees);
    }
    catch (err) {
        console.error('[DB Error] GET /api/employees:', err);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});
// PUT update employee status in Database
router.put('/:id/status', (0, authorize_1.authorize)('employees', 'write'), async (req, res) => {
    try {
        const updated = await prisma_1.prisma.employee.update({
            where: { id: req.params.id },
            data: { status: req.body.status }
        });
        (0, mockData_1.logSystemEvent)('API Server', `Employee ${updated.name} status updated to ${updated.status} in DB`, 'info');
        res.json(updated);
    }
    catch (err) {
        console.error('[DB Error] PUT /api/employees/:id/status:', err);
        res.status(500).json({ error: 'Failed to update employee status' });
    }
});
// POST create new employee account in Database
router.post('/', (0, authorize_1.authorize)('employees', 'write'), (0, validators_1.validateBody)(validators_1.createEmployeeSchema), async (req, res) => {
    try {
        const lastEmp = await prisma_1.prisma.employee.findFirst({
            orderBy: { empCode: 'desc' }
        });
        let nextNum = 1;
        if (lastEmp && lastEmp.empCode) {
            const match = lastEmp.empCode.match(/(\d+)$/);
            if (match) {
                nextNum = parseInt(match[1], 10) + 1;
            }
        }
        const empCode = `EMP-${String(nextNum).padStart(3, '0')}`;
        const defaultPasswordHash = await bcryptjs_1.default.hash('password123', 10);
        const newEmp = await prisma_1.prisma.employee.create({
            data: {
                empCode,
                name: req.body.name,
                email: req.body.email,
                department: req.body.department,
                designation: req.body.designation,
                role: req.body.role || 'Engineer',
                status: req.body.status || 'Active',
                passwordHash: defaultPasswordHash
            }
        });
        (0, mockData_1.logSystemEvent)('API Server', `New employee registered in DB: ${newEmp.name} (${newEmp.empCode})`, 'info');
        res.status(201).json(newEmp);
    }
    catch (err) {
        console.error('[DB Error] POST /api/employees:', err);
        res.status(500).json({ error: 'Failed to create employee' });
    }
});
// Update Employee Details
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, designation, department, role, status } = req.body;
        const updated = await prisma_1.prisma.employee.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(email && { email }),
                ...(designation && { designation }),
                ...(department && { department }),
                ...(role && { role }),
                ...(status && { status })
            }
        });
        res.json(updated);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update employee', details: err.message });
    }
});
// PATCH /api/employees/:id/leave-balance — HR editable CL/SL/PL balances
router.patch('/:id/leave-balance', async (req, res) => {
    try {
        const { id } = req.params;
        const { casualLeaveBalance, sickLeaveBalance, privilegeLeaveBalance } = req.body;
        const updated = await prisma_1.prisma.employee.update({
            where: { id },
            data: {
                ...(casualLeaveBalance !== undefined && { casualLeaveBalance: Number(casualLeaveBalance) }),
                ...(sickLeaveBalance !== undefined && { sickLeaveBalance: Number(sickLeaveBalance) }),
                ...(privilegeLeaveBalance !== undefined && { privilegeLeaveBalance: Number(privilegeLeaveBalance) })
            }
        });
        (0, mockData_1.logSystemEvent)('API Server', `Leave balances updated for ${updated.name} (${updated.empCode})`, 'info');
        res.json(updated);
    }
    catch (err) {
        console.error('[DB Error] PATCH /api/employees/:id/leave-balance:', err);
        res.status(500).json({ error: 'Failed to update leave balance', details: err.message });
    }
});
exports.default = router;
