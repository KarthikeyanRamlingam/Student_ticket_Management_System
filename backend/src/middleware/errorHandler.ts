import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export class AppError extends Error {
  statusCode: number;
  errors?: any;

  constructor(message: string, statusCode = 400, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(`[Error] ${req.method} ${req.path}:`, err);

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  // Handle Prisma Known Errors
  if (err.code === 'P2002') {
    const fields = (err.meta?.target as string[])?.join(', ') || 'field';
    return sendError(res, `A record with this ${fields} already exists.`, 409);
  }

  if (err.code === 'P2025') {
    return sendError(res, 'Record not found.', 404);
  }

  // Multer Errors
  if (err.name === 'MulterError') {
    return sendError(res, `File upload error: ${err.message}`, 400);
  }

  return sendError(
    res,
    process.env.NODE_ENV === 'production'
      ? 'An unexpected internal server error occurred.'
      : err.message || 'Internal server error',
    500
  );
}
