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
        logger.warn(`[Auth] Invalid token: ${err.message}`);
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
    }

    // Dev fallback: only allow unauthenticated requests if explicitly enabled
    if (process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEV_FALLBACK === 'true') {
      logger.warn('[Auth] DEV FALLBACK active — no token provided, using dev admin user');
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
      return next();
    }

    return res.status(401).json({ error: 'Authentication required' });
  } catch (err: any) {
    logger.error(`[Auth] Middleware error: ${err.message}`);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

