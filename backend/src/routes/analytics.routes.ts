import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get(
  '/student',
  authenticate,
  authorize(Role.STUDENT),
  (req, res, next) => analyticsController.getStudentAnalytics(req, res, next)
);

router.get(
  '/staff',
  authenticate,
  authorize(Role.STAFF, Role.ADMIN),
  (req, res, next) => analyticsController.getStaffAnalytics(req, res, next)
);

router.get(
  '/admin',
  authenticate,
  authorize(Role.ADMIN),
  (req, res, next) => analyticsController.getAdminAnalytics(req, res, next)
);

export default router;
