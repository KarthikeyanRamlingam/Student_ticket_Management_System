import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { sendError } from '../utils/response';

export function validateBody(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message
        }));
        return sendError(res, 'Validation failed: ' + issues.map(i => `${i.field}: ${i.message}`).join(', '), 400, issues);
      }
      return sendError(res, 'Invalid request payload', 400);
    }
  };
}

export function validateQuery(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message
        }));
        return sendError(res, 'Invalid query parameters: ' + issues.map(i => `${i.field}: ${i.message}`).join(', '), 400, issues);
      }
      return sendError(res, 'Invalid query parameters', 400);
    }
  };
}
