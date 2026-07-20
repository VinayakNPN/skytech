import { Router } from 'express';
import { prisma } from '../db/prisma';
import { logSystemEvent } from '../data/mockData';

const router = Router();

// GET all employees from Database
router.get('/', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { empCode: 'asc' }
    });
    res.json(employees);
  } catch (err: any) {
    console.error('[DB Error] GET /api/employees:', err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// PUT update employee status in Database
router.put('/:id/status', async (req, res) => {
  try {
    const updated = await prisma.employee.update({
      where: { id: req.params.id },
      data: { status: req.body.status }
    });
    logSystemEvent('API Server', `Employee ${updated.name} status updated to ${updated.status} in DB`, 'info');
    res.json(updated);
  } catch (err: any) {
    console.error('[DB Error] PUT /api/employees/:id/status:', err);
    res.status(500).json({ error: 'Failed to update employee status' });
  }
});

// POST create new employee account in Database
router.post('/', async (req, res) => {
  try {
    const count = await prisma.employee.count();
    const empCode = `EMP-0${count + 1}`;

    const newEmp = await prisma.employee.create({
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

    logSystemEvent('API Server', `New employee registered in DB: ${newEmp.name} (${newEmp.empCode})`, 'info');
    res.status(201).json(newEmp);
  } catch (err: any) {
    console.error('[DB Error] POST /api/employees:', err);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

export default router;
