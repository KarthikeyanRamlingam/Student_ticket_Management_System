import React from 'react';
import { Priority } from '../types';
import { AlertCircle, AlertTriangle, ArrowDown, Flame } from 'lucide-react';

interface Props {
  priority: Priority;
  size?: 'sm' | 'md';
}

export function PriorityBadge({ priority, size = 'md' }: Props) {
  const configs: Record<
    Priority,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    LOW: {
      label: 'Low',
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      border: 'border-slate-200',
      icon: <ArrowDown className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
    },
    MEDIUM: {
      label: 'Medium',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: <AlertCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
    },
    HIGH: {
      label: 'High',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: <AlertTriangle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
    },
    URGENT: {
      label: 'Urgent',
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: <Flame className={size === 'sm' ? 'w-3 h-3 text-red-600' : 'w-3.5 h-3.5 text-red-600'} />
    }
  };

  const config = configs[priority] || configs.MEDIUM;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border ${config.bg} ${config.text} ${config.border} ${padding}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
}
