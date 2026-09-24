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
  Loader2
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
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    setLoading(true);
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
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar onOpenCreateModal={() => setCreateModalOpen(true)} />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Welcome back, {user.name}
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {user.role === 'STUDENT'
                  ? `Student ID: ${user.studentIdNumber || 'STU-2024'} • Manage your requests and track SLA deadlines.`
                  : user.role === 'STAFF'
                  ? `Department: ${user.department?.name || 'General Support'} • Assigned queue and resolution workflows.`
                  : 'Executive overview, SLA compliance monitoring, and department workload analytics.'}
              </p>
            </div>

            {user.role === 'STUDENT' && (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Create New Ticket</span>
              </button>
            )}
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button onClick={loadDashboard} className="underline font-semibold">
                Retry
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && !data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse" />
                ))}
              </div>
              <div className="h-64 bg-white rounded-2xl border border-slate-200 animate-pulse" />
            </div>
          )}

          {/* ============================================================== */}
          {/* 1. STUDENT VIEW                                                */}
          {/* ============================================================== */}
          {user.role === 'STUDENT' && data?.cards && (
            <div className="space-y-6">
              {/* Action Required Alert Banner */}
              {data.actionRequired && data.actionRequired.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3 shadow-sm animate-in fade-in">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h2 className="text-sm font-bold">Action Required: Staff requested information</h2>
                    <p className="text-xs text-amber-800 mt-0.5">
                      You have {data.actionRequired.length} ticket(s) waiting for your response before processing can resume.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {data.actionRequired.map((t: any) => (
                        <Link
                          key={t.id}
                          href={`/tickets/${t.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-amber-100 rounded-lg text-xs font-semibold text-amber-900 border border-amber-300 transition-colors"
                        >
                          <span className="font-mono">{t.ticketNumber}</span>
                          <span>• {t.title}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Student Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Total Tickets</span>
                    <TicketIcon className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-2">{data.cards?.total ?? 0}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Open</span>
                    <Clock className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mt-2">{data.cards?.open ?? 0}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">In Progress</span>
                    <PlayCircle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-bold text-amber-600 mt-2">{data.cards?.inProgress ?? 0}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Waiting for Me</span>
                    <HelpCircle className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-2xl font-bold text-purple-600 mt-2">{data.cards?.waitingForMe ?? 0}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Resolved</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-bold text-emerald-600 mt-2">{data.cards?.resolved ?? 0}</div>
                </div>
              </div>

              {/* Recent Tickets Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Recent Requests</h2>
                    <p className="text-xs text-slate-500">Track current status and resolution SLAs</p>
                  </div>
                  <Link
                    href="/tickets"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <span>View all my tickets</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                        <th className="py-2.5 px-3">Ticket</th>
                        <th className="py-2.5 px-3">Title</th>
                        <th className="py-2.5 px-3">Priority</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">SLA Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {(data.recentTickets || []).map((t: any) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-indigo-600">
                            {t.ticketNumber}
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-900 max-w-xs truncate">
                            {t.title}
                          </td>
                          <td className="py-3 px-3">
                            <PriorityBadge priority={t.priority} size="sm" />
                          </td>
                          <td className="py-3 px-3">
                            <StatusBadge status={t.status} size="sm" />
                          </td>
                          <td className="py-3 px-3">
                            <SlaBadge metrics={t.metrics} size="sm" />
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Link
                              href={`/tickets/${t.id}`}
                              className="text-indigo-600 font-semibold hover:underline"
                            >
                              Open Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 2. STAFF VIEW                                                  */}
          {/* ============================================================== */}
          {user.role === 'STAFF' && data?.cards && (
            <div className="space-y-6">
              {/* Staff Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500">Assigned to Me</div>
                  <div className="text-2xl font-bold text-indigo-600 mt-2">{data.cards?.assignedToMe ?? 0}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500">In Progress</div>
                  <div className="text-2xl font-bold text-amber-600 mt-2">{data.cards?.inProgress ?? 0}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500">Waiting for Student</div>
                  <div className="text-2xl font-bold text-purple-600 mt-2">{data.cards?.waitingForStudent ?? 0}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500">Due Soon</div>
                  <div className="text-2xl font-bold text-amber-700 mt-2">{data.cards?.dueSoon ?? 0}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500">Overdue</div>
                  <div className="text-2xl font-bold text-rose-600 mt-2">{data.cards?.overdue ?? 0}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500">Unassigned Pool</div>
                  <div className="text-2xl font-bold text-blue-600 mt-2">{data.cards?.unassignedCount ?? 0}</div>
                </div>
              </div>

              {/* Urgent Queue */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Priority & Approaching SLA Queue</h2>
                      <p className="text-xs text-slate-500">Tickets requiring urgent staff attention</p>
                    </div>
                  </div>
                  <Link
                    href="/tickets?priority=URGENT"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <span>View all priority queue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {(!data.urgentQueue || data.urgentQueue.length === 0) ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No urgent tickets pending in your queue.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                          <th className="py-2.5 px-3">Ticket</th>
                          <th className="py-2.5 px-3">Title</th>
                          <th className="py-2.5 px-3">Student</th>
                          <th className="py-2.5 px-3">Priority</th>
                          <th className="py-2.5 px-3">SLA Status</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {data.urgentQueue.map((t: any) => (
                          <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-indigo-600">
                              {t.ticketNumber}
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-900 max-w-xs truncate">
                              {t.title}
                            </td>
                            <td className="py-3 px-3">{t.student?.name}</td>
                            <td className="py-3 px-3">
                              <PriorityBadge priority={t.priority} size="sm" />
                            </td>
                            <td className="py-3 px-3">
                              <SlaBadge metrics={t.metrics} size="sm" />
                            </td>
                            <td className="py-3 px-3 text-right">
                              <Link
                                href={`/tickets/${t.id}`}
                                className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100"
                              >
                                Work On Ticket
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 3. ADMIN MANAGEMENT VIEW                                       */}
          {/* ============================================================== */}
          {user.role === 'ADMIN' && data?.cards && data?.charts && (
            <div className="space-y-6">
              {/* Executive Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500">Total Tickets</div>
                  <div className="text-2xl font-bold text-slate-900 mt-2">{data.cards?.total ?? 0}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500">Open Tickets</div>
                  <div className="text-2xl font-bold text-blue-600 mt-2">{data.cards?.open ?? 0}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500">Resolved</div>
                  <div className="text-2xl font-bold text-emerald-600 mt-2">{data.cards?.resolved ?? 0}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500">Overdue</div>
                  <div className="text-2xl font-bold text-rose-600 mt-2">{data.cards?.overdue ?? 0}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500">Unassigned</div>
                  <div className="text-2xl font-bold text-amber-600 mt-2">{data.cards?.unassigned ?? 0}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500">SLA Compliance</div>
                  <div className="text-2xl font-bold text-indigo-600 mt-2">{data.cards?.slaComplianceRate ?? 100}%</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500">Avg Resolution</div>
                  <div className="text-2xl font-bold text-slate-800 mt-2">{data.cards?.avgResolutionHours ?? 0}h</div>
                </div>
              </div>

              {/* Management Analytics Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tickets by Category */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Tickets by Category</h2>
                    <p className="text-xs text-slate-500">Distribution of complaints across campus services</p>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.charts?.byCategory || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          angle={-25}
                          textAnchor="end"
                          interval={0}
                        />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: 8, color: '#fff', fontSize: 12 }}
                        />
                        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Ageing Distribution */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Ageing Analysis (Open Tickets)</h2>
                    <p className="text-xs text-slate-500">Unresolved ticket duration buckets</p>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.charts?.ageingDistribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: 8, color: '#fff', fontSize: 12 }}
                        />
                        <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Staff Workload */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Staff Workload & Productivity</h2>
                    <p className="text-xs text-slate-500">Active vs Resolved tickets per officer</p>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.charts?.staffWorkload || []} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: 8, color: '#fff', fontSize: 12 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="active" name="Active Tickets" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="done" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Status Breakdown Pie */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Status Workflow Distribution</h2>
                    <p className="text-xs text-slate-500">System-wide ticket state distribution</p>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={(data.charts?.byStatus || []).filter((s: any) => s.count > 0)}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {(data.charts?.byStatus || []).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* SLA Breaches & Overdue List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <div>
                      <h2 className="text-base font-bold text-slate-900">SLA Breaches & Overdue Escalations</h2>
                      <p className="text-xs text-slate-500">Tickets exceeding defined resolution deadlines</p>
                    </div>
                  </div>
                  <Link
                    href="/tickets?slaStatus=OVERDUE"
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                  >
                    View All Overdue
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                        <th className="py-2.5 px-3">Ticket</th>
                        <th className="py-2.5 px-3">Title</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Assignee</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">SLA Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {(data.slaBreaches || []).map((t: any) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-indigo-600">
                            {t.ticketNumber}
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-900 max-w-xs truncate">
                            {t.title}
                          </td>
                          <td className="py-3 px-3">{t.category?.name}</td>
                          <td className="py-3 px-3">
                            {t.assignedStaff ? t.assignedStaff.name : <span className="text-amber-600">Unassigned</span>}
                          </td>
                          <td className="py-3 px-3">
                            <StatusBadge status={t.status} size="sm" />
                          </td>
                          <td className="py-3 px-3">
                            <SlaBadge metrics={t.metrics} size="sm" />
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Link
                              href={`/tickets/${t.id}`}
                              className="text-xs font-semibold text-rose-600 hover:underline"
                            >
                              Intervene / Escalate
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <CreateTicketModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onTicketCreated={() => {
          loadDashboard();
        }}
      />
    </div>
  );
}
