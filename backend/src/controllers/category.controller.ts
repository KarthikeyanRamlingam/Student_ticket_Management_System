import { Response, NextFunction } from 'express';
import { categoryService } from '../services/category.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess } from '../utils/response';

export class CategoryController {
  async listCategories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const categories = await categoryService.listCategories(includeInactive);
      return sendSuccess(res, categories, 'Categories retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  async listDepartments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const departments = await categoryService.listDepartments();
      return sendSuccess(res, departments, 'Departments retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  async createCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const category = await categoryService.createCategory(req.body);
      return sendSuccess(res, category, 'Category created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async updateCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const category = await categoryService.updateCategory(req.params.id, req.body);
      return sendSuccess(res, category, 'Category updated successfully', 200);
    } catch (err) {
      next(err);
    }
  }
}

export const categoryController = new CategoryController();
