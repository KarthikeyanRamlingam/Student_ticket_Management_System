import React from 'react';
import { Priority } from '../types';
import { ArrowDown, Minus, ArrowUp, Zap } from 'lucide-react';

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
      bg: 'bg-slate-100/90',
      text: 'text-slate-700',
      border: 'border-slate-200',
      icon: <ArrowDown className={size === 'sm' ? 'w-3 h-3 text-slate-500' : 'w-3.5 h-3.5 text-slate-500'} />
    },
    MEDIUM: {
      label: 'Medium',
      bg: 'bg-sky-50',
      text: 'text-sky-800',
      border: 'border-sky-200',
      icon: <Minus className={size === 'sm' ? 'w-3 h-3 text-sky-600' : 'w-3.5 h-3.5 text-sky-600'} />
    },
    HIGH: {
      label: 'High',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      icon: <ArrowUp className={size === 'sm' ? 'w-3 h-3 text-amber-600' : 'w-3.5 h-3.5 text-amber-600'} />
    },
    URGENT: {
      label: 'Urgent',
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-200',
      icon: <Zap className={size === 'sm' ? 'w-3 h-3 text-rose-600 fill-rose-600' : 'w-3.5 h-3.5 text-rose-600 fill-rose-600'} />
    }
  };

  const config = configs[priority] || configs.MEDIUM;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-lg border shadow-xs ${config.bg} ${config.text} ${config.border} ${padding}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
}
