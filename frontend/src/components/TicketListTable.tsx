'use client';

import React from 'react';
import Link from 'next/link';
import { Ticket, Role } from '../types';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { SlaBadge } from './SlaBadge';
import { ArrowRight, Inbox, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  tickets: Ticket[];
  role: Role;
  loading: boolean;
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (newPage: number) => void;
}

export function TicketListTable({
  tickets,
  role,
  loading,
  page,
  totalPages,
  totalCount,
  onPageChange
}: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 bg-slate-100/80 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-500 mb-3">
          <Inbox className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No Tickets Found</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          No records match your active search terms or filter criteria. Try clearing some filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <th className="py-3 px-4">Ticket</th>
              <th className="py-3 px-4">Subject</th>
              {role !== 'STUDENT' && <th className="py-3 px-4">Student</th>}
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Assignee</th>
              <th className="py-3 px-4">SLA Deadline</th>
              <th className="py-3 px-4">Age</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {tickets.map((t) => (
              <tr
                key={t.id}
                className="hover:bg-indigo-50/30 transition-colors group"
              >
                {/* Ticket Number & Category */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="font-mono font-bold text-indigo-600 text-xs">
                    {t.ticketNumber}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {t.category.name}
                  </span>
                </td>

                {/* Title */}
                <td className="py-3 px-4 max-w-xs">
                  <Link
                    href={`/tickets/${t.id}`}
                    className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1"
                    title={t.title}
                  >
                    {t.title}
                  </Link>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {t.description}
                  </p>
                </td>

                {/* Student info (for staff/admin) */}
                {role !== 'STUDENT' && (
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-800">{t.student.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {t.student.studentIdNumber || t.student.email}
                    </div>
                  </td>
                )}

                {/* Priority */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <PriorityBadge priority={t.priority} size="sm" />
                </td>

                {/* Status */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <StatusBadge status={t.status} size="sm" />
                </td>

                {/* Assignee */}
                <td className="py-3 px-4 whitespace-nowrap">
                  {t.assignedStaff ? (
                    <div className="text-slate-800 font-medium text-xs">
                      {t.assignedStaff.name}
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      Unassigned
                    </span>
                  )}
                </td>

                {/* SLA Indicator */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <SlaBadge metrics={t.metrics} size="sm" />
                </td>

                {/* Age */}
                <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-medium text-[11px]">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {t.metrics.ageDays < 1
                      ? `${Math.round(t.metrics.ageDays * 24)}h`
                      : `${t.metrics.ageDays}d`}
                  </span>
                </td>

                {/* Action Link */}
                <td className="py-3 px-4 whitespace-nowrap text-right">
                  <Link
                    href={`/tickets/${t.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 bg-slate-50/75 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing page <span className="font-semibold text-slate-800">{page}</span> of{' '}
          <span className="font-semibold text-slate-800">{totalPages || 1}</span> (Total{' '}
          <span className="font-semibold text-slate-800">{totalCount}</span> tickets)
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-mono font-semibold">{page}</span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
