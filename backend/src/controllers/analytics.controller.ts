import { Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess } from '../utils/response';

export class AnalyticsController {
  async getStudentAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getStudentAnalytics(req.user!);
      return sendSuccess(res, data, 'Student dashboard metrics', 200);
    } catch (err) {
      next(err);
    }
  }

  async getStaffAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getStaffAnalytics(req.user!);
      return sendSuccess(res, data, 'Staff dashboard metrics', 200);
    } catch (err) {
      next(err);
    }
  }

  async getAdminAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getAdminAnalytics();
      return sendSuccess(res, data, 'Admin analytics and management metrics', 200);
    } catch (err) {
      next(err);
    }
  }
}

export const analyticsController = new AnalyticsController();
