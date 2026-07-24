import { Request, Response, NextFunction } from 'express';
import { EmployeePermissions } from '../types/permissions';

export function authorize(roles: string[]): (req: Request, res: Response, next: NextFunction) => void;
export function authorize(module: keyof EmployeePermissions, action: 'read' | 'write' | 'delete'): (req: Request, res: Response, next: NextFunction) => void;
export function authorize(
  moduleOrRoles: keyof EmployeePermissions | string[],
  action?: 'read' | 'write' | 'delete'
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admins bypass all checks
    if (req.user.isAdmin) {
      return next();
    }

    if (Array.isArray(moduleOrRoles)) {
      const allowedRoles = moduleOrRoles;
      if (req.user.role && allowedRoles.includes(req.user.role)) {
        return next();
      }
      return res.status(403).json({ error: `Access denied: requires one of roles [${allowedRoles.join(', ')}]` });
    }

    const module = moduleOrRoles;
    const permissions = req.user.permissions;
    if (action && (!permissions || !permissions[module] || !(permissions[module] as any)[action])) {
      return res.status(403).json({ error: `Access denied: missing ${action} permission for ${module}` });
    }

    next();
  };
}

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
