import { Priority, TicketStatus } from '@prisma/client';
import { AgeingBucket, SlaStatus, TicketComputedMetrics } from '../types';

export const DEFAULT_SLA_HOURS: Record<Priority, { resolutionHours: number; warningHours: number }> = {
  URGENT: { resolutionHours: 8, warningHours: 2 },
  HIGH: { resolutionHours: 24, warningHours: 6 },
  MEDIUM: { resolutionHours: 48, warningHours: 12 },
  LOW: { resolutionHours: 72, warningHours: 18 }
};

export function calculateSlaDueDate(createdAt: Date, priority: Priority, customHours?: number): Date {
  const hours = customHours ?? DEFAULT_SLA_HOURS[priority].resolutionHours;
  const dueDate = new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
  return dueDate;
}

export function computeTicketMetrics(ticket: {
  createdAt: Date | string;
  slaDueAt: Date | string;
  resolvedAt?: Date | string | null;
  status: TicketStatus;
  priority: Priority;
}): TicketComputedMetrics {
  const now = new Date();
  const created = new Date(ticket.createdAt);
  const due = new Date(ticket.slaDueAt);
  const resolved = ticket.resolvedAt ? new Date(ticket.resolvedAt) : null;

  const warningHours = DEFAULT_SLA_HOURS[ticket.priority]?.warningHours || 6;
  const warningMs = warningHours * 60 * 60 * 1000;

  const isResolvedOrClosed = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';

  let slaStatus: SlaStatus = 'WITHIN_SLA';
  let isOverdue = false;
  let isDueSoon = false;
  let isBreached = false;

  if (isResolvedOrClosed) {
    const compareTime = resolved ? resolved.getTime() : now.getTime();
    if (compareTime <= due.getTime()) {
      slaStatus = 'MET';
    } else {
      slaStatus = 'BREACHED';
      isBreached = true;
    }
  } else {
    const diffMs = due.getTime() - now.getTime();
    if (diffMs < 0) {
      slaStatus = 'OVERDUE';
      isOverdue = true;
    } else if (diffMs <= warningMs) {
      slaStatus = 'DUE_SOON';
      isDueSoon = true;
    } else {
      slaStatus = 'WITHIN_SLA';
    }
  }

  const hoursRemaining = parseFloat(((due.getTime() - now.getTime()) / (1000 * 60 * 60)).toFixed(1));
  const ageDays = parseFloat(((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)).toFixed(1));

  let ageingBucket: AgeingBucket = '0_1_DAYS';
  if (ageDays >= 8) {
    ageingBucket = '8_PLUS_DAYS';
  } else if (ageDays >= 4) {
    ageingBucket = '4_7_DAYS';
  } else if (ageDays >= 2) {
    ageingBucket = '2_3_DAYS';
  } else {
    ageingBucket = '0_1_DAYS';
  }

  return {
    slaStatus,
    hoursRemaining,
    ageDays,
    ageingBucket,
    isOverdue,
    isDueSoon,
    isBreached
  };
}
