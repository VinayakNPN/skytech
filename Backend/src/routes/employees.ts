import { Router } from 'express';
import { prisma } from '../db/prisma';
import { logSystemEvent } from '../data/mockData';
import { validateBody, createEmployeeSchema } from '../validators';
import { authorize } from '../middleware/authorize';
import bcrypt from 'bcryptjs';

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
    const defaultPasswordHash = await bcrypt.hash('password123', 10);

    const newEmp = await prisma.employee.create({
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

    logSystemEvent('API Server', `New employee registered in DB: ${newEmp.name} (${newEmp.empCode})`, 'info');
    res.status(201).json(newEmp);
  } catch (err: any) {
    console.error('[DB Error] POST /api/employees:', err);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// Update Employee Details
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, designation, department, role, status, isAdmin, permissions } = req.body;
    
    let permissionsStr: string | undefined;
    if (permissions !== undefined) {
      permissionsStr = typeof permissions === 'string' ? permissions : JSON.stringify(permissions);
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: { 
        ...(name && { name }),
        ...(email && { email }),
        ...(designation && { designation }),
        ...(department && { department }),
        ...(role && { role }),
        ...(status && { status }),
        ...(isAdmin !== undefined && { isAdmin }),
        ...(permissionsStr !== undefined && { permissions: permissionsStr })
      }
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update employee', details: err.message });
  }
});

// DELETE employee
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await prisma.employee.delete({
      where: { id }
    });
    logSystemEvent('API Server', `Employee ${deleted.name} (${deleted.empCode}) deleted from DB`, 'info');
    res.json({ message: 'Employee deleted successfully', employee: deleted });
  } catch (err: any) {
    console.error('[DB Error] DELETE /api/employees/:id:', err);
    res.status(500).json({ error: 'Failed to delete employee', details: err.message });
  }
});

// PATCH /api/employees/:id/leave-balance — HR editable CL/SL/PL balances
router.patch('/:id/leave-balance', async (req, res) => {
  try {
    const { id } = req.params;
    const { casualLeaveBalance, sickLeaveBalance, privilegeLeaveBalance } = req.body;
    const updated = await prisma.employee.update({
      where: { id },
      data: {
        ...(casualLeaveBalance !== undefined && { casualLeaveBalance: Number(casualLeaveBalance) }),
        ...(sickLeaveBalance !== undefined && { sickLeaveBalance: Number(sickLeaveBalance) }),
        ...(privilegeLeaveBalance !== undefined && { privilegeLeaveBalance: Number(privilegeLeaveBalance) })
      }
    });
    logSystemEvent('API Server', `Leave balances updated for ${updated.name} (${updated.empCode})`, 'info');
    res.json(updated);
  } catch (err: any) {
    console.error('[DB Error] PATCH /api/employees/:id/leave-balance:', err);
    res.status(500).json({ error: 'Failed to update leave balance', details: err.message });
  }
});

export default router;

