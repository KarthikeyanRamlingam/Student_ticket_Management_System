import React from 'react';
import { TicketMetrics } from '../types';
import { CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react';

interface Props {
  metrics: TicketMetrics;
  size?: 'sm' | 'md';
}

export function SlaBadge({ metrics, size = 'md' }: Props) {
  const { slaStatus, hoursRemaining } = metrics;

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  if (slaStatus === 'MET') {
    return (
      <span className={`inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 ${padding}`}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>SLA Met</span>
      </span>
    );
  }

  if (slaStatus === 'BREACHED') {
    return (
      <span className={`inline-flex items-center gap-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 ${padding}`}>
        <XCircle className="w-3.5 h-3.5 text-rose-600" />
        <span>SLA Breached</span>
      </span>
    );
  }

  if (slaStatus === 'OVERDUE') {
    const overdueHours = Math.abs(hoursRemaining);
    return (
      <span className={`inline-flex items-center gap-1 rounded-md bg-red-50 text-red-700 border border-red-300 font-semibold animate-pulse ${padding}`}>
        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
        <span>Overdue ({overdueHours}h)</span>
      </span>
    );
  }

  if (slaStatus === 'DUE_SOON') {
    return (
      <span className={`inline-flex items-center gap-1 rounded-md bg-amber-50 text-amber-800 border border-amber-300 font-medium ${padding}`}>
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        <span>Due Soon ({hoursRemaining}h)</span>
      </span>
    );
  }

  // WITHIN_SLA
  return (
    <span className={`inline-flex items-center gap-1 rounded-md bg-slate-50 text-slate-700 border border-slate-200 ${padding}`}>
      <Clock className="w-3.5 h-3.5 text-slate-500" />
      <span>{hoursRemaining > 0 ? `${hoursRemaining}h left` : 'On track'}</span>
    </span>
  );
}
