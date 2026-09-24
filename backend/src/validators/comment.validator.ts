import { z } from 'zod';
import { CommentVisibility } from '@prisma/client';

export const createCommentSchema = z.object({
  message: z.string().min(2, 'Message cannot be empty').max(3000, 'Message cannot exceed 3000 characters'),
  visibility: z.nativeEnum(CommentVisibility).optional().default(CommentVisibility.PUBLIC)
});
