import { z } from 'zod';
import { Priority } from '@prisma/client';

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  departmentId: z.string().uuid(),
  defaultPriority: z.nativeEnum(Priority).optional().default(Priority.MEDIUM),
  defaultSlaHours: z.number().int().min(1).max(720).optional().default(48),
  isActive: z.boolean().optional().default(true)
});

export const updateCategorySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  departmentId: z.string().uuid().optional(),
  defaultPriority: z.nativeEnum(Priority).optional(),
  defaultSlaHours: z.number().int().min(1).max(720).optional(),
  isActive: z.boolean().optional()
});
