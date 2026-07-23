import { Request, Response, NextFunction } from 'express';
import { EmployeePermissions } from '../types/permissions';

export const authorize = (module: keyof EmployeePermissions, action: 'read' | 'write' | 'delete') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admins bypass all checks
    if (req.user.isAdmin) {
      return next();
    }

    const permissions = req.user.permissions;
    if (!permissions || !permissions[module] || !(permissions[module] as any)[action]) {
      return res.status(403).json({ error: `Access denied: missing ${action} permission for ${module}` });
    }

    next();
  };
};

export const requireAdmin = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied: Admin privileges required' });
    }

    next();
  };
};
