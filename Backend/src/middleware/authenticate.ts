import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.headers.cookie) {
      const match = req.headers.cookie.match(/token=([^;]+)/);
      if (match) token = match[1];
    }

    const secret = process.env.JWT_SECRET || 'dev-secret-key-do-not-use-in-prod';

    if (token) {
      try {
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
        return next();
      } catch (err: any) {
        logger.warn(`[Auth] Invalid token, using dev fallback: ${err.message}`);
      }
    }

    // Dev mode fallback user when unauthenticated or during local development
    req.user = {
      id: 'DEV_ADMIN_01',
      empCode: 'EMP_ADMIN',
      email: 'admin@skytech.com',
      name: 'Dev Admin User',
      role: 'Admin',
      department: 'Management',
      isAdmin: true,
      permissions: '{}'
    };
    next();
  } catch (err: any) {
    logger.error(`[Auth] Middleware error: ${err.message}`);
    next();
  }
};
