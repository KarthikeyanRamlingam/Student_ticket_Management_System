import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { Priority } from '@prisma/client';

export class CategoryService {
  async listCategories(includeInactive = false) {
    return prisma.category.findMany({
      where: includeInactive ? undefined : { isActive: true },
      include: {
        department: {
          select: { id: true, name: true, code: true }
        },
        _count: {
          select: { tickets: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async listDepartments() {
    return prisma.department.findMany({
      include: {
        categories: {
          where: { isActive: true },
          select: { id: true, name: true, defaultPriority: true, defaultSlaHours: true }
        },
        _count: {
          select: { tickets: true, staff: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async createCategory(data: {
    name: string;
    description?: string;
    departmentId: string;
    defaultPriority?: Priority;
    defaultSlaHours?: number;
    isActive?: boolean;
  }) {
    const department = await prisma.department.findUnique({
      where: { id: data.departmentId }
    });

    if (!department) {
      throw new AppError('Department not found.', 404);
    }

    return prisma.category.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        departmentId: data.departmentId,
        defaultPriority: data.defaultPriority || Priority.MEDIUM,
        defaultSlaHours: data.defaultSlaHours || 48,
        isActive: data.isActive !== undefined ? data.isActive : true
      },
      include: {
        department: true
      }
    });
  }

  async updateCategory(
    id: string,
    data: {
      name?: string;
      description?: string;
      departmentId?: string;
      defaultPriority?: Priority;
      defaultSlaHours?: number;
      isActive?: boolean;
    }
  ) {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw new AppError('Category not found.', 404);

    return prisma.category.update({
      where: { id },
      data: {
        ...data,
        name: data.name ? data.name.trim() : undefined,
        description: data.description !== undefined ? data.description.trim() : undefined
      },
      include: {
        department: true
      }
    });
  }
}

export const categoryService = new CategoryService();
