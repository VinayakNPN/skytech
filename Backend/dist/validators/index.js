"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmployeeSchema = exports.createWBSTaskSchema = exports.createInquirySchema = exports.validateBody = void 0;
const zod_1 = require("zod");
const validateBody = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: result.error.issues.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message
                }))
            });
        }
        req.body = result.data;
        next();
    };
};
exports.validateBody = validateBody;
exports.createInquirySchema = zod_1.z.object({
    client: zod_1.z.string().min(1, 'Client / Company Name is required'),
    project: zod_1.z.string().min(1, 'Project Description / Panel Type is required'),
    amount: zod_1.z.coerce.number().positive('Quoted Amount must be greater than 0'),
    contactPerson: zod_1.z.string().min(1, 'Contact Person Name is required'),
    email: zod_1.z.string().min(1, 'Email is required').email('Invalid email format (must include @ and .com)'),
    phone: zod_1.z.string().min(1, 'Contact Phone is required').regex(/^\+?[0-9\s-]{8,15}$/, 'Invalid phone format (e.g. +91 98000 00000 or 10-digit)'),
    date: zod_1.z.string().optional(),
    status: zod_1.z.enum(['Inquiry Received', 'Offer Sent', 'Confirmed', 'Unconfirmed']).optional().default('Inquiry Received'),
    remarks: zod_1.z.string().optional().default('')
});
exports.createWBSTaskSchema = zod_1.z.object({
    wbsCode: zod_1.z.string().min(1, 'WBS code is required'),
    name: zod_1.z.string().min(1, 'Task name is required'),
    phaseId: zod_1.z.string().min(1, 'Phase ID is required'),
    inquiryId: zod_1.z.string().optional().nullable(),
    owner: zod_1.z.string().min(1, 'Owner is required'),
    planHours: zod_1.z.coerce.number().min(0, 'Plan hours must be positive'),
    actualHours: zod_1.z.coerce.number().min(0).optional().default(0),
    status: zod_1.z.enum(['DONE', 'IN PROGRESS', 'NOT STARTED']).optional().default('NOT STARTED'),
    progress: zod_1.z.coerce.number().min(0).max(100).optional().default(0)
});
exports.createEmployeeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Employee name is required'),
    email: zod_1.z.string().email('Valid email is required'),
    department: zod_1.z.string().min(1, 'Department is required'),
    designation: zod_1.z.string().min(1, 'Designation is required'),
    role: zod_1.z.enum(['Admin', 'Engineer', 'Supervisor', 'Operator', 'Viewer', 'Manager', 'HR']).optional().default('Engineer'),
    status: zod_1.z.enum(['Active', 'On Leave', 'Suspended']).optional().default('Active')
});
