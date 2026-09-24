import { Request } from 'express';
import { Role, TicketStatus, Priority, EscalationLevel, CommentVisibility, ActivityType } from '@prisma/client';

export { Role, TicketStatus, Priority, EscalationLevel, CommentVisibility, ActivityType };

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
  departmentId?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  errors?: any;
}

export type SlaStatus = 'WITHIN_SLA' | 'DUE_SOON' | 'OVERDUE' | 'MET' | 'BREACHED';

export type AgeingBucket = '0_1_DAYS' | '2_3_DAYS' | '4_7_DAYS' | '8_PLUS_DAYS';

export interface TicketComputedMetrics {
  slaStatus: SlaStatus;
  hoursRemaining: number;
  ageDays: number;
  ageingBucket: AgeingBucket;
  isOverdue: boolean;
  isDueSoon: boolean;
  isBreached: boolean;
}
