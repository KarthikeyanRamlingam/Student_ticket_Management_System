import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { Role } from '@prisma/client';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator';

const router = Router();

router.get('/', authenticate, (req, res, next) => categoryController.listCategories(req, res, next));
router.get('/departments', authenticate, (req, res, next) => categoryController.listDepartments(req, res, next));

router.post(
  '/',
  authenticate,
  authorize(Role.ADMIN),
  validateBody(createCategorySchema),
  (req, res, next) => categoryController.createCategory(req, res, next)
);

router.patch(
  '/:id',
  authenticate,
  authorize(Role.ADMIN),
  validateBody(updateCategorySchema),
  (req, res, next) => categoryController.updateCategory(req, res, next)
);

export default router;
