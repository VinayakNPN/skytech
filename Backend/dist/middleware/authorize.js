"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
exports.authorize = authorize;
function authorize(moduleOrRoles, action) {
    return (req, res, next) => {
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
        if (action && (!permissions || !permissions[module] || !permissions[module][action])) {
            return res.status(403).json({ error: `Access denied: missing ${action} permission for ${module}` });
        }
        next();
    };
}
const requireAdmin = () => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Access denied: Admin privileges required' });
        }
        next();
    };
};
exports.requireAdmin = requireAdmin;
