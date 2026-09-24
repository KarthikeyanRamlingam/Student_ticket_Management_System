import React from 'react';
import { TicketStatus } from '../types';
import {
  Clock,
  UserCheck,
  PlayCircle,
  HelpCircle,
  CheckCircle2,
  Lock,
  RotateCcw
} from 'lucide-react';

interface Props {
  status: TicketStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const configs: Record<
    TicketStatus,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    OPEN: {
      label: 'Open',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
    },
    ASSIGNED: {
      label: 'Assigned',
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      icon: <UserCheck className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
    },
    IN_PROGRESS: {
      label: 'In Progress',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: <PlayCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
    },
    WAITING_FOR_STUDENT: {
      label: 'Waiting for Student',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      icon: <HelpCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
    },
    RESOLVED: {
      label: 'Resolved',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
    },
    CLOSED: {
      label: 'Closed',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      icon: <Lock className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
    },
    REOPENED: {
      label: 'Reopened',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      icon: <RotateCcw className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
    }
  };

  const config = configs[status] || configs.OPEN;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.text} ${config.border} ${padding}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
}
