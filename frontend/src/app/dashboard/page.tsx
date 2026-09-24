'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { SlaBadge } from '../../components/SlaBadge';
import { CreateTicketModal } from '../../components/CreateTicketModal';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import {
  Ticket as TicketIcon,
  Clock,
  PlayCircle,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  ArrowRight,
  Zap,
  TrendingUp,
  RefreshCw,
  Search,
  ShieldCheck,
  Building2,
  ExternalLink,
  Flame,
  Activity,
  Calendar,
  Check
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      let endpoint = '/analytics/student';
      if (user.role === 'STAFF') endpoint = '/analytics/staff';
      if (user.role === 'ADMIN') endpoint = '/analytics/admin';

      const res = await api.get(endpoint);
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      setData(null);
      loadDashboard();
    }
  }, [user?.id, user?.role, authLoading, router, loadDashboard]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading CampusResolve...</p>
        </div>
      </div>
    );
  }

  const CHART_COLORS = ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f43f5e'];

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs">
          <p className="font-bold text-slate-200 mb-1">{label || payload[0].name}</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color || '#6366f1' }} />
            <span className="text-slate-400">Count:</span>
            <span className="font-mono font-bold text-white">{payload[0].value} tickets</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar onOpenCreateModal={() => setCreateModalOpen(true)} />

      <div className="flex flex-1">
        <Sidebar onOpenCreateModal={() => setCreateModalOpen(true)} />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Executive Control Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-50/60 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  {user.role === 'STUDENT' ? 'Student Workspace' : user.role === 'STAFF' ? 'Operational Dispatch' : 'Executive Command'}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  SLA Engine Online
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
                {user.role === 'STUDENT' ? `Welcome, ${user.name}` : `Executive Dashboard • ${user.name}`}
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {user.role === 'STUDENT'
                  ? `Student ID: ${user.studentIdNumber || 'STU-2024'} • Instant tracking of administrative inquiries and resolution progress.`
                  : user.role === 'STAFF'
                  ? `Department: ${user.department?.name || 'Institutional Operations'} • Real-time queue claiming and SLA compliance.`
                  : 'Institutional oversight, SLA compliance metrics, and cross-departmental workload distribution.'}
              </p>
            </div>

            <div className="flex items-center gap-2.5 relative z-10">
              {/* Refresh Sync Button */}
              <button
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                className="p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 border border-slate-200/80 rounded-xl transition-all shadow-xs disabled:opacity-50"
                title="Refresh metrics sync"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
              </button>

              {user.role === 'STUDENT' ? (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/35 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Submit Support Ticket</span>
                </button>
              ) : (
                <Link
                  href="/tickets"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-slate-900/10 transition-all hover:scale-[1.02]"
                >
                  <TicketIcon className="w-4 h-4 text-indigo-400" />
                  <span>View Full Queue</span>
                </Link>
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => loadDashboard()} className="underline font-bold text-rose-900 hover:text-rose-950">
                Retry Connection
              </button>
            </div>
          )}

          {/* Loading Skeletons */}
          {loading && !data && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 bg-white rounded-3xl border border-slate-200/80 animate-pulse" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-72 bg-white rounded-3xl border border-slate-200/80 animate-pulse" />
                <div className="h-72 bg-white rounded-3xl border border-slate-200/80 animate-pulse" />
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 1. STUDENT VIEW                                                */}
          {/* ============================================================== */}
          {user.role === 'STUDENT' && data?.cards && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Action Required Banner */}
              {data.actionRequired && data.actionRequired.length > 0 && (
                <div className="p-5 rounded-3xl bg-amber-50/90 border border-amber-200 text-amber-950 flex items-start gap-3.5 shadow-sm">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold">Action Required: Clarification Requested by Campus Staff</h3>
                    <p className="text-xs text-amber-800/90 mt-0.5">
                      Our staff is waiting on additional documents or details from you to continue processing your tickets.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {data.actionRequired.map((t: any) => (
                        <Link
                          key={t.id}
                          href={`/tickets/${t.id}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors shadow-xs"
                        >
                          <span className="font-mono text-amber-700">{t.ticketNumber}</span>
                          <span className="truncate max-w-[200px]">{t.title}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Student KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs card-hover">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Total Submitted</span>
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                      <TicketIcon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 font-mono mt-2 tracking-tight">
                    {data.cards.totalTickets}
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 mt-1 block">Lifetime tickets</span>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs card-hover">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">In Progress</span>
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <PlayCircle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-indigo-600 font-mono mt-2 tracking-tight">
                    {data.cards.activeTickets}
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-600/80 mt-1 block">Being worked on</span>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs card-hover">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Awaiting Info</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-amber-600 font-mono mt-2 tracking-tight">
                    {data.cards.waitingForStudent}
                  </div>
                  <span className="text-[11px] font-semibold text-amber-600/80 mt-1 block">Requires your reply</span>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs card-hover">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Resolved</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-600 font-mono mt-2 tracking-tight">
                    {data.cards.resolvedTickets}
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600/80 mt-1 block">Successfully closed</span>
                </div>
              </div>

              {/* Recent Student Tickets Table */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Your Recent Inquiries</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Click any ticket to inspect conversation thread or post replies</p>
                  </div>
                  <Link
                    href="/tickets"
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <span>View All Inquiries</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {data.recentTickets && data.recentTickets.length > 0 ? (
                  <div className="divide-y divide-slate-100 overflow-x-auto">
                    {data.recentTickets.map((t: any) => (
                      <Link
                        key={t.id}
                        href={`/tickets/${t.id}`}
                        className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors group"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="font-mono text-xs font-bold text-indigo-600 group-hover:underline">
                            {t.ticketNumber}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                              {t.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {t.category?.name} • Dept: {t.category?.department?.name || 'General'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <PriorityBadge priority={t.priority} size="sm" />
                          <StatusBadge status={t.status} size="sm" />
                          {t.metrics && <SlaBadge metrics={t.metrics} size="sm" />}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 text-center text-xs text-slate-500">
                    You haven't submitted any tickets yet. Click "Submit Support Ticket" above to get started.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 2. STAFF VIEW                                                  */}
          {/* ============================================================== */}
          {user.role === 'STAFF' && data?.cards && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Staff KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs card-hover">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Assigned To Me</span>
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <TicketIcon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-indigo-600 font-mono mt-2 tracking-tight">
                    {data.cards.assignedToMe}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 mt-1 block">Active desk queue</span>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs card-hover">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Department Pool</span>
                    <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                      <Building2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 font-mono mt-2 tracking-tight">
                    {data.cards.openInDepartment}
                  </div>
                  <span className="text-[11px] font-semibold text-sky-600/80 mt-1 block">Available to claim</span>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs card-hover">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Urgent Attention</span>
                    <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                      <Flame className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-rose-600 font-mono mt-2 tracking-tight">
                    {data.cards.urgentTickets}
                  </div>
                  <span className="text-[11px] font-semibold text-rose-600/80 mt-1 block">SLA risk / urgent</span>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs card-hover">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Resolved (7 Days)</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-600 font-mono mt-2 tracking-tight">
                    {data.cards.resolvedThisWeek}
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600/80 mt-1 block">Weekly velocity</span>
                </div>
              </div>

              {/* Urgent Operational Rail */}
              {data.urgentTicketsList && data.urgentTicketsList.length > 0 && (
                <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl relative overflow-hidden border border-slate-800">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                      </span>
                      <h3 className="text-sm font-bold text-white tracking-wide">
                        Urgent Attention Queue — Critical & SLA Escalations
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {data.urgentTicketsList.length} Tickets Flagged
                    </span>
                  </div>

                  <div className="divide-y divide-slate-800/80 mt-2">
                    {data.urgentTicketsList.map((t: any) => (
                      <div key={t.id} className="py-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className="font-mono text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 shrink-0">
                            {t.ticketNumber}
                          </span>
                          <div className="truncate">
                            <span className="text-xs font-bold text-slate-100">{t.title}</span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              Student: {t.student?.name} • Category: {t.category?.name}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {t.metrics && <SlaBadge metrics={t.metrics} size="sm" />}
                          <Link
                            href={`/tickets/${t.id}`}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold transition-all shadow-xs"
                          >
                            Inspect & Claim
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* 3. ADMIN / EXECUTIVE VIEW                                      */}
          {/* ============================================================== */}
          {user.role === 'ADMIN' && data?.cards && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Executive KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs card-hover">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Campus Volume</span>
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <TicketIcon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 font-mono mt-2 tracking-tight">
                    {data.cards.totalTickets}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 mt-1 block">All registered tickets</span>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs card-hover">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Active Pipeline</span>
                    <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                      <PlayCircle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-sky-600 font-mono mt-2 tracking-tight">
                    {data.cards.activeTickets}
                  </div>
                  <span className="text-[11px] font-semibold text-sky-600/80 mt-1 block">Unresolved load</span>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs card-hover">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">SLA Compliance</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-600 font-mono mt-2 tracking-tight">
                    {data.cards.slaComplianceRate}%
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600/80 mt-1 block">Target: 90%+</span>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs card-hover">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">SLA Breaches</span>
                    <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-rose-600 font-mono mt-2 tracking-tight">
                    {data.cards.breachedTickets}
                  </div>
                  <span className="text-[11px] font-semibold text-rose-600/80 mt-1 block">Overdue tickets</span>
                </div>
              </div>

              {/* Executive Visual Analytics Suite */}
              {data.charts && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Department Workload Chart */}
                  <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Workload by Department</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Ticket load across campus faculties</p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-bold">
                        Distribution
                      </span>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={data.charts.byDepartment || []}
                          margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            interval={0}
                            angle={-15}
                            textAnchor="end"
                          />
                          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                          <Tooltip content={<CustomChartTooltip />} />
                          <Bar dataKey="value" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Priority Breakdown Donut Chart */}
                  <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Priority Severity Breakdown</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Urgent vs High vs Normal ticket inflow</p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-bold">
                        Severity
                      </span>
                    </div>

                    <div className="h-64 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.charts.byPriority || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {(data.charts.byPriority || []).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomChartTooltip />} />
                          <Legend
                            formatter={(value) => <span className="text-xs font-semibold text-slate-700">{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <CreateTicketModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onTicketCreated={() => {
          setCreateModalOpen(false);
          loadDashboard(true);
        }}
      />
    </div>
  );
}
