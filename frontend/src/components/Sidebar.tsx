'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Ticket as TicketIcon,
  PlusCircle,
  Inbox,
  UserCheck,
  FolderTree,
  ClockAlert,
  Flame,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  onOpenCreateModal?: () => void;
}

export function Sidebar({ onOpenCreateModal }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const role = user.role;

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 border-r border-slate-800/80 shadow-xl">
      <div className="space-y-6">
        {/* Workspace Card */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Workspace</span>
            <span className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              {role}
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-sm font-bold text-white tracking-tight">
              {role === 'STUDENT' ? 'Student Helpdesk' : role === 'STAFF' ? `${user.department?.name || 'Staff Desk'}` : 'Executive Operations'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">{user.email}</p>
          </div>
        </div>

        {/* Primary Action Button */}
        {role === 'STUDENT' && onOpenCreateModal && (
          <button
            onClick={onOpenCreateModal}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit New Ticket</span>
          </button>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1.5 text-xs font-semibold">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Main Menu</p>

          {/* Dashboard */}
          <Link
            href="/dashboard"
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
              isActive('/dashboard')
                ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              <span>Executive Dashboard</span>
            </div>
            {isActive('/dashboard') && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
          </Link>

          {/* Tickets Center */}
          <Link
            href="/tickets"
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
              isActive('/tickets') && !pathname.includes('assignedStaffId')
                ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <TicketIcon className="w-4 h-4 text-sky-400" />
              <span>{role === 'STUDENT' ? 'My Support Tickets' : 'Tickets Center'}</span>
            </div>
            {isActive('/tickets') && !pathname.includes('assignedStaffId') && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
          </Link>

          {/* Staff specific queues */}
          {role === 'STAFF' && (
            <>
              <p className="px-3 pt-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Queue Filters</p>
              <Link
                href="/tickets?assignedStaffId=me"
                className="flex items-center justify-between px-3.5 py-2 rounded-xl text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-3">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Assigned to Me</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </Link>
              <Link
                href="/tickets?assignedStaffId=unassigned"
                className="flex items-center justify-between px-3.5 py-2 rounded-xl text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Inbox className="w-4 h-4 text-amber-400" />
                  <span>Unclaimed Pool</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-400">Queue</span>
              </Link>
            </>
          )}

          {/* Admin specific */}
          {role === 'ADMIN' && (
            <>
              <p className="px-3 pt-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Administration</p>
              <Link
                href="/categories"
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                  isActive('/categories')
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FolderTree className="w-4 h-4 text-violet-400" />
                  <span>Categories & SLAs</span>
                </div>
                {isActive('/categories') && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
              </Link>
              <Link
                href="/tickets?slaStatus=OVERDUE"
                className="flex items-center justify-between px-3.5 py-2 rounded-xl text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ClockAlert className="w-4 h-4 text-rose-400" />
                  <span>Overdue Escalations</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Production Operational Health Indicator */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        <div className="px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-medium text-slate-400">PostgreSQL Engine</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold">LIVE</span>
        </div>

        <div className="px-1 text-[11px] text-slate-500 flex items-center justify-between">
          <span>CampusResolve Enterprise</span>
          <span className="font-mono text-[10px] text-slate-400">v2.0.4</span>
        </div>
      </div>
    </aside>
  );
}
