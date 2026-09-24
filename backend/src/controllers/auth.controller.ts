import { Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess } from '../utils/response';

export class AuthController {
  async register(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      return sendSuccess(res, result, 'Student registered successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      return sendSuccess(res, result, 'Login successful', 200);
    } catch (err) {
      next(err);
    }
  }

  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getMe(req.user!.userId);
      return sendSuccess(res, user, 'Profile retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  async listStaff(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const departmentId = req.query.departmentId as string | undefined;
      const staffList = await authService.listStaff(departmentId);
      return sendSuccess(res, staffList, 'Staff list retrieved', 200);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
