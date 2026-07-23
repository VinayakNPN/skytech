import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication token missing' });
    }

    const secret = process.env.JWT_SECRET || 'dev-secret-key-do-not-use-in-prod';
    const decoded = jwt.verify(token, secret) as any;

    req.user = {
      id: decoded.id,
      empCode: decoded.empCode,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      department: decoded.department,
      isAdmin: decoded.isAdmin,
      permissions: decoded.permissions
    };

    next();
  } catch (err: any) {
    logger.error(`[Auth] Token verification failed: ${err.message}`);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
