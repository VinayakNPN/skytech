"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../db/prisma");
const mockData_1 = require("../data/mockData");
const router = (0, express_1.Router)();
// GET all employees from Database
router.get('/', async (req, res) => {
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
router.put('/:id/status', async (req, res) => {
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
router.post('/', async (req, res) => {
    try {
        const count = await prisma_1.prisma.employee.count();
        const empCode = `EMP-0${count + 1}`;
        const newEmp = await prisma_1.prisma.employee.create({
            data: {
                empCode,
                name: req.body.name || 'New Employee',
                email: req.body.email || 'employee@skytech.com',
                department: req.body.department || 'Mechanical Dept.',
                designation: req.body.designation || 'Engineer',
                role: req.body.role || 'Operator',
                status: req.body.status || 'Active'
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
exports.default = router;
