import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  details?: any;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`Error processing request [${req.method} ${req.url}]:`, err);

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    details: err.details || null,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
