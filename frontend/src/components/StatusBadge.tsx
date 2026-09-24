import React from 'react';
import { TicketStatus } from '../types';

interface Props {
  status: TicketStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const configs: Record<
    TicketStatus,
    { label: string; bg: string; text: string; border: string; dot: string; pulse?: boolean }
  > = {
    OPEN: {
      label: 'Open',
      bg: 'bg-sky-50/90',
      text: 'text-sky-800',
      border: 'border-sky-200/80',
      dot: 'bg-sky-500',
      pulse: false
    },
    ASSIGNED: {
      label: 'Assigned',
      bg: 'bg-indigo-50/90',
      text: 'text-indigo-800',
      border: 'border-indigo-200/80',
      dot: 'bg-indigo-600',
      pulse: false
    },
    IN_PROGRESS: {
      label: 'In Progress',
      bg: 'bg-amber-50/90',
      text: 'text-amber-800',
      border: 'border-amber-200/80',
      dot: 'bg-amber-500',
      pulse: true
    },
    WAITING_FOR_STUDENT: {
      label: 'Waiting Info',
      bg: 'bg-violet-50/90',
      text: 'text-violet-800',
      border: 'border-violet-200/80',
      dot: 'bg-violet-500',
      pulse: false
    },
    RESOLVED: {
      label: 'Resolved',
      bg: 'bg-emerald-50/90',
      text: 'text-emerald-800',
      border: 'border-emerald-200/80',
      dot: 'bg-emerald-600',
      pulse: false
    },
    CLOSED: {
      label: 'Closed',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300/80',
      dot: 'bg-slate-400',
      pulse: false
    },
    REOPENED: {
      label: 'Reopened',
      bg: 'bg-rose-50/90',
      text: 'text-rose-800',
      border: 'border-rose-200/80',
      dot: 'bg-rose-600',
      pulse: true
    }
  };

  const config = configs[status] || configs.OPEN;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold tracking-wide rounded-full border shadow-xs ${config.bg} ${config.text} ${config.border} ${padding}`}
    >
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
      </span>
      <span>{config.label}</span>
    </span>
  );
}
