import { z } from 'zod';
import { Priority, TicketStatus, EscalationLevel } from '@prisma/client';

export const createTicketSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().min(15, 'Description must be at least 15 characters').max(5000, 'Description cannot exceed 5000 characters'),
  categoryId: z.string().uuid('Valid Category ID is required'),
  priority: z.nativeEnum(Priority).optional()
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(TicketStatus, { errorMap: () => ({ message: 'Invalid ticket status' }) }),
  resolutionNotes: z.string().max(2000).optional(),
  reason: z.string().max(1000).optional()
});

export const assignTicketSchema = z.object({
  staffId: z.string().uuid('Valid Staff ID is required')
});

export const updatePrioritySchema = z.object({
  priority: z.nativeEnum(Priority, { errorMap: () => ({ message: 'Invalid priority level' }) }),
  reason: z.string().min(3, 'Reason for priority change is required').max(500)
});

export const escalateTicketSchema = z.object({
  escalationLevel: z.nativeEnum(EscalationLevel, { errorMap: () => ({ message: 'Invalid escalation level' }) }),
  reason: z.string().min(5, 'Escalation reason must be at least 5 characters').max(1000)
});

export const reopenTicketSchema = z.object({
  reason: z.string().min(10, 'Please provide a clear reason for reopening the ticket (minimum 10 characters)').max(1000)
});

export const listTicketsQuerySchema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  categoryId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  assignedStaffId: z.string().optional(),
  slaStatus: z.enum(['WITHIN_SLA', 'DUE_SOON', 'OVERDUE', 'MET', 'BREACHED']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'slaDueAt', 'priority', 'status', 'ticketNumber']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10)
});
