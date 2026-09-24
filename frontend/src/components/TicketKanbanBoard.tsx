'use client';

import React from 'react';
import Link from 'next/link';
import { Ticket, Role, TicketStatus } from '../types';
import { PriorityBadge } from './PriorityBadge';
import { SlaBadge } from './SlaBadge';
import { Clock, User, ArrowRight, Sparkles, Building2 } from 'lucide-react';

interface Props {
  tickets: Ticket[];
  role: Role;
  loading: boolean;
}

export function TicketKanbanBoard({ tickets, role, loading }: Props) {
  const columns: { status: TicketStatus; label: string; dot: string; bg: string }[] = [
    { status: 'OPEN', label: 'Open Queue', dot: 'bg-sky-500', bg: 'bg-sky-500/10' },
    { status: 'IN_PROGRESS', label: 'In Progress', dot: 'bg-amber-500', bg: 'bg-amber-500/10' },
    { status: 'WAITING_FOR_STUDENT', label: 'Waiting for Info', dot: 'bg-violet-500', bg: 'bg-violet-500/10' },
    { status: 'RESOLVED', label: 'Resolved', dot: 'bg-emerald-500', bg: 'bg-emerald-500/10' }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-3">
            <div className="h-6 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-32 bg-slate-50 rounded-2xl animate-pulse" />
            <div className="h-32 bg-slate-50 rounded-2xl animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
      {columns.map((col) => {
        const colTickets = tickets.filter(
          (t) => t.status === col.status || (col.status === 'IN_PROGRESS' && t.status === 'ASSIGNED')
        );

        return (
          <div
            key={col.status}
            className="bg-slate-100/60 rounded-3xl p-3.5 border border-slate-200/80 flex flex-col min-h-[480px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-2 py-1.5 mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                <h3 className="text-xs font-bold text-slate-800 tracking-tight">{col.label}</h3>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200 shadow-2xs">
                {colTickets.length}
              </span>
            </div>

            {/* Ticket Cards */}
            <div className="space-y-3 overflow-y-auto max-h-[650px] pr-0.5">
              {colTickets.length > 0 ? (
                colTickets.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tickets/${t.id}`}
                    className="block p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all card-hover group"
                  >
                    {/* Top Row: Ticket Number & Priority */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-indigo-600 group-hover:underline">
                        {t.ticketNumber}
                      </span>
                      <PriorityBadge priority={t.priority} size="sm" />
                    </div>

                    {/* Title */}
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                      {t.title}
                    </h4>

                    {/* Category & Department */}
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{t.category?.name}</span>
                    </div>

                    {/* Footer: Assignee & SLA */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700 shrink-0">
                          {t.assignedStaff ? t.assignedStaff.name.charAt(0) : <User className="w-3 h-3 text-slate-400" />}
                        </div>
                        <span className="text-[10px] text-slate-600 font-medium truncate">
                          {t.assignedStaff ? t.assignedStaff.name : 'Unassigned'}
                        </span>
                      </div>

                      {t.metrics && <SlaBadge metrics={t.metrics} size="sm" />}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                  No tickets in this stage
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
