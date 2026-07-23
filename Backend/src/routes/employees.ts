import { Router } from 'express';
import { prisma } from '../db/prisma';
import { logSystemEvent } from '../data/mockData';
import { validateBody, createEmployeeSchema } from '../validators';
import { authorize } from '../middleware/authorize';

const router = Router();

// GET all employees from Database
router.get('/', authorize('employees', 'read'), async (req, res) => {
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
router.put('/:id/status', authorize('employees', 'write'), async (req, res) => {
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
router.post('/', authorize('employees', 'write'), validateBody(createEmployeeSchema), async (req, res) => {
  try {
    const lastEmp = await prisma.employee.findFirst({
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

    const newEmp = await prisma.employee.create({
      data: {
        empCode,
        name: req.body.name,
        email: req.body.email,
        department: req.body.department,
        designation: req.body.designation,
        role: req.body.role || 'Engineer',
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
