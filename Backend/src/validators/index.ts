import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    req.body = result.data;
    next();
  };
};

export const createInquirySchema = z.object({
  client: z.string().min(1, 'Client / Company Name is required'),
  project: z.string().min(1, 'Project Description / Panel Type is required'),
  amount: z.coerce.number().positive('Quoted Amount must be greater than 0'),
  contactPerson: z.string().min(1, 'Contact Person Name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email format (must include @ and .com)'),
  phone: z.string().min(1, 'Contact Phone is required').regex(/^\+?[0-9\s-]{8,15}$/, 'Invalid phone format (e.g. +91 98000 00000 or 10-digit)'),
  date: z.string().optional(),
  status: z.enum(['Inquiry Received', 'Offer Sent', 'Confirmed', 'Unconfirmed']).optional().default('Inquiry Received'),
  remarks: z.string().optional().default('')
});

export const createWBSTaskSchema = z.object({
  wbsCode: z.string().min(1, 'WBS code is required'),
  name: z.string().min(1, 'Task name is required'),
  phaseId: z.string().min(1, 'Phase ID is required'),
  inquiryId: z.string().optional().nullable(),
  owner: z.string().min(1, 'Owner is required'),
  planHours: z.coerce.number().min(0, 'Plan hours must be positive'),
  actualHours: z.coerce.number().min(0).optional().default(0),
  status: z.enum(['DONE', 'IN PROGRESS', 'NOT STARTED']).optional().default('NOT STARTED'),
  progress: z.coerce.number().min(0).max(100).optional().default(0)
});

export const createEmployeeSchema = z.object({
  name: z.string().min(1, 'Employee name is required'),
  email: z.string().email('Valid email is required'),
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
  role: z.enum(['Admin', 'Engineer', 'Supervisor', 'Operator', 'Viewer', 'Manager', 'HR']).optional().default('Engineer'),
  status: z.enum(['Active', 'On Leave', 'Suspended']).optional().default('Active')
});
