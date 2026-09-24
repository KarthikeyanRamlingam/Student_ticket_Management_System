import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize(Role.STAFF, Role.ADMIN),
  (req, res, next) => authController.listStaff(req, res, next)
);

export default router;
