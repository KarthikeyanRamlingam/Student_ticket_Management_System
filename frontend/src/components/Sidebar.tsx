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
  Users,
  ClockAlert
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
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 border-r border-slate-800">
      <div className="space-y-6">
        {/* Role Badge Container */}
        <div className="px-3 py-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Workspace</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-bold text-white tracking-wide">
              {role === 'STUDENT' ? 'Student Portal' : role === 'STAFF' ? 'Staff Desk' : 'Executive Console'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {role}
            </span>
          </div>
          {user.department && (
            <p className="text-xs text-slate-400 mt-1">Dept: {user.department.name}</p>
          )}
        </div>

        {/* Primary CTA for Student */}
        {role === 'STUDENT' && onOpenCreateModal && (
          <button
            onClick={onOpenCreateModal}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Ticket</span>
          </button>
        )}

        {/* Navigation Section */}
        <nav className="space-y-1 text-sm font-medium">
          {/* Dashboard */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
              isActive('/dashboard')
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          {/* Tickets */}
          <Link
            href="/tickets"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
              isActive('/tickets')
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <TicketIcon className="w-4 h-4" />
            <span>{role === 'STUDENT' ? 'My Tickets' : 'Ticket Queue'}</span>
          </Link>

          {/* Staff specific links */}
          {role === 'STAFF' && (
            <>
              <Link
                href="/tickets?assignedStaffId=me"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-800 hover:text-white transition-colors"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Assigned to Me</span>
              </Link>
              <Link
                href="/tickets?assignedStaffId=unassigned"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Inbox className="w-4 h-4 text-amber-400" />
                <span>Unassigned Pool</span>
              </Link>
            </>
          )}

          {/* Admin specific links */}
          {role === 'ADMIN' && (
            <>
              <Link
                href="/categories"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                  isActive('/categories')
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FolderTree className="w-4 h-4 text-indigo-400" />
                <span>Categories & SLAs</span>
              </Link>
              <Link
                href="/tickets?slaStatus=OVERDUE"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-800 hover:text-white transition-colors"
              >
                <ClockAlert className="w-4 h-4 text-rose-400" />
                <span>Overdue Tickets</span>
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800 text-xs text-slate-500">
        <p className="font-semibold text-slate-400">CampusResolve v1.0</p>
        <p className="mt-0.5 text-[11px]">SLA-Driven Institutional Operations</p>
      </div>
    </aside>
  );
}
