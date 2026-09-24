'use client';

import React from 'react';
import Link from 'next/link';
import { Ticket, Role } from '../types';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { SlaBadge } from './SlaBadge';
import { ArrowRight, Inbox, Clock, ChevronLeft, ChevronRight, User, Building2 } from 'lucide-react';

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
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs p-6 space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-14 bg-slate-100/70 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 mb-3 shadow-xs">
          <Inbox className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No Tickets Match Criteria</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          Try clearing your active search filter or resetting status filters to view the full queue.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
              <th className="py-3.5 px-5">Ticket ID</th>
              <th className="py-3.5 px-4">Subject & Category</th>
              {role !== 'STUDENT' && <th className="py-3.5 px-4">Student</th>}
              <th className="py-3.5 px-4">Priority</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Assignee</th>
              <th className="py-3.5 px-4">SLA Deadline</th>
              <th className="py-3.5 px-4">Age</th>
              <th className="py-3.5 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {tickets.map((t) => (
              <tr
                key={t.id}
                className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
              >
                {/* Ticket Number */}
                <td className="py-3.5 px-5 whitespace-nowrap">
                  <div className="font-mono font-bold text-indigo-600 text-xs tracking-tight group-hover:underline">
                    {t.ticketNumber}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {t.department?.code || 'GEN'}
                  </span>
                </td>

                {/* Title & Category */}
                <td className="py-3.5 px-4 max-w-sm">
                  <Link
                    href={`/tickets/${t.id}`}
                    className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 text-xs"
                    title={t.title}
                  >
                    {t.title}
                  </Link>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {t.category?.name}
                  </p>
                </td>

                {/* Student info (for staff/admin) */}
                {role !== 'STUDENT' && (
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                        {t.student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 leading-tight">{t.student.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {t.student.studentIdNumber || t.student.email}
                        </div>
                      </div>
                    </div>
                  </td>
                )}

                {/* Priority */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <PriorityBadge priority={t.priority} size="sm" />
                </td>

                {/* Status */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <StatusBadge status={t.status} size="sm" />
                </td>

                {/* Assignee */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {t.assignedStaff ? (
                    <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs">
                      <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-[10px]">
                        {t.assignedStaff.name.charAt(0)}
                      </div>
                      <span>{t.assignedStaff.name}</span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      Unassigned
                    </span>
                  )}
                </td>

                {/* SLA Indicator */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <SlaBadge metrics={t.metrics} size="sm" />
                </td>

                {/* Age */}
                <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-medium text-[11px]">
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {t.metrics.ageDays < 1
                      ? `${Math.round(t.metrics.ageDays * 24)}h`
                      : `${t.metrics.ageDays}d`}
                  </span>
                </td>

                {/* Action Link */}
                <td className="py-3.5 px-5 whitespace-nowrap text-right">
                  <Link
                    href={`/tickets/${t.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-all shadow-2xs group-hover:scale-105"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800 font-mono">{tickets.length}</span> of{' '}
          <span className="font-bold text-slate-800 font-mono">{totalCount}</span> tickets
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl shadow-2xs font-mono">
            {page} / {totalPages}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
