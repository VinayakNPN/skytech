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
  client: z.string().min(1, 'Client name is required'),
  project: z.string().min(1, 'Project name is required'),
  amount: z.coerce.number().min(0, 'Amount must be positive'),
  contactPerson: z.string().optional().default(''),
  email: z.string().email('Invalid email').or(z.literal('')).optional().default(''),
  phone: z.string().optional().default(''),
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
