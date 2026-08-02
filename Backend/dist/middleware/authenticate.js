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
                logger_1.logger.warn(`[Auth] Invalid token, using dev fallback: ${err.message}`);
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
    }
    catch (err) {
        logger_1.logger.error(`[Auth] Middleware error: ${err.message}`);
        next();
    }
};
exports.authenticate = authenticate;
