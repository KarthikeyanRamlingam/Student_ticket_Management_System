import React from 'react';
import { TicketMetrics } from '../types';
import { CheckCircle2, Clock, AlertTriangle, XCircle, Timer } from 'lucide-react';

interface Props {
  metrics: TicketMetrics;
  size?: 'sm' | 'md';
}

export function SlaBadge({ metrics, size = 'md' }: Props) {
  const { slaStatus, hoursRemaining } = metrics;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  if (slaStatus === 'MET') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs ${padding}`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>SLA Met</span>
      </span>
    );
  }

  if (slaStatus === 'BREACHED') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold rounded-lg bg-rose-50 text-rose-800 border border-rose-200 shadow-xs ${padding}`}>
        <XCircle className="w-3.5 h-3.5 text-rose-600" />
        <span>Breached</span>
      </span>
    );
  }

  if (slaStatus === 'OVERDUE') {
    const overdueHours = Math.abs(hoursRemaining);
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold rounded-lg bg-rose-100 text-rose-900 border border-rose-300 shadow-xs animate-pulse ${padding}`}>
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
        <span className="font-mono">{overdueHours}h overdue</span>
      </span>
    );
  }

  if (slaStatus === 'DUE_SOON') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold rounded-lg bg-amber-50 text-amber-900 border border-amber-300 shadow-xs ${padding}`}>
        <Timer className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: '4s' }} />
        <span className="font-mono">{hoursRemaining}h left</span>
      </span>
    );
  }

  // WITHIN_SLA
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-lg bg-slate-100 text-slate-800 border border-slate-200 shadow-xs ${padding}`}>
      <Clock className="w-3.5 h-3.5 text-slate-500" />
      <span className="font-mono">{hoursRemaining > 0 ? `${hoursRemaining}h left` : 'Within SLA'}</span>
    </span>
  );
}
