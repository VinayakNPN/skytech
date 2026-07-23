import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/authorize';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-do-not-use-in-prod';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const employee = await prisma.employee.findUnique({ where: { email } });
    if (!employee || employee.status !== 'Active') {
      return res.status(401).json({ error: 'Invalid credentials or inactive account' });
    }

    const isValid = await bcrypt.compare(password, employee.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    let permissionsObj = {};
    try {
      permissionsObj = JSON.parse(employee.permissions);
    } catch (e) {
      logger.warn(`Failed to parse permissions for ${employee.empCode}`);
    }

    const payload = {
      id: employee.id,
      empCode: employee.empCode,
      email: employee.email,
      name: employee.name,
      role: employee.role,
      department: employee.department,
      isAdmin: employee.isAdmin,
      permissions: permissionsObj
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    res.json({ token, user: payload });
  } catch (error: any) {
    logger.error(`[Auth] Login error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/register (Admin Only)
router.post('/register', authenticate, requireAdmin(), async (req, res) => {
  try {
    const { empCode, name, email, department, designation, role, password, isAdmin, permissions, status } = req.body;
    
    if (!empCode || !name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUser = await prisma.employee.findFirst({
      where: {
        OR: [{ email }, { empCode }]
      }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Employee with this email or code already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const permString = typeof permissions === 'string' ? permissions : JSON.stringify(permissions || {});

    const newEmployee = await prisma.employee.create({
      data: {
        empCode,
        name,
        email,
        department: department || '',
        designation: designation || '',
        role: role || 'Employee',
        passwordHash,
        isAdmin: isAdmin || false,
        permissions: permString,
        status: status || 'Active'
      }
    });

    res.status(201).json({ message: 'Employee registered successfully', employeeId: newEmployee.id });
  } catch (error: any) {
    logger.error(`[Auth] Registration error: ${error.message}`);
    res.status(500).json({ error: 'Failed to register employee' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?.id;
    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const employee = await prisma.employee.findUnique({ where: { id: userId } });
    if (!employee) return res.status(404).json({ error: 'User not found' });

    const isValid = await bcrypt.compare(oldPassword, employee.passwordHash);
    if (!isValid) return res.status(401).json({ error: 'Incorrect old password' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.employee.update({
      where: { id: userId },
      data: { passwordHash: newHash }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    logger.error(`[Auth] Change password error: ${error.message}`);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
