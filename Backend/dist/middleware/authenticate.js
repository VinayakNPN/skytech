"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../utils/logger");
const authenticate = (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        else if (req.headers.cookie) {
            const match = req.headers.cookie.match(/token=([^;]+)/);
            if (match)
                token = match[1];
        }
        const secret = process.env.JWT_SECRET || 'dev-secret-key-do-not-use-in-prod';
        if (token) {
            try {
                const decoded = jsonwebtoken_1.default.verify(token, secret);
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
            }
            catch (err) {
                logger_1.logger.warn(`[Auth] Invalid token: ${err.message}`);
                return res.status(401).json({ error: 'Invalid or expired token' });
            }
        }
        // Dev fallback: only allow unauthenticated requests if explicitly enabled
        if (process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEV_FALLBACK === 'true') {
            logger_1.logger.warn('[Auth] DEV FALLBACK active — no token provided, using dev admin user');
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
    }
    catch (err) {
        logger_1.logger.error(`[Auth] Middleware error: ${err.message}`);
        return res.status(500).json({ error: 'Authentication error' });
    }
};
exports.authenticate = authenticate;
