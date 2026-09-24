'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Ticket, Category } from '../../types';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { TicketListTable } from '../../components/TicketListTable';
import { CreateTicketModal } from '../../components/CreateTicketModal';
import { Search, RotateCcw, PlusCircle, Loader2 } from 'lucide-react';

function TicketsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState<string>(searchParams.get('status') || '');
  const [priority, setPriority] = useState<string>(searchParams.get('priority') || '');
  const [categoryId, setCategoryId] = useState<string>(searchParams.get('categoryId') || '');
  const [slaStatus, setSlaStatus] = useState<string>(searchParams.get('slaStatus') || '');
  const [assignedStaffId, setAssignedStaffId] = useState<string>(searchParams.get('assignedStaffId') || '');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Load Categories for filter dropdown
  useEffect(() => {
    if (user) {
      api.get<Category[]>('/categories')
        .then((res) => setCategories(res.data))
        .catch(() => {});
    }
  }, [user]);

  const loadTickets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Ticket[]>('/tickets', {
        search: search.trim() || undefined,
        status: status || undefined,
        priority: priority || undefined,
        categoryId: categoryId || undefined,
        slaStatus: slaStatus || undefined,
        assignedStaffId: assignedStaffId || undefined,
        sortBy,
        sortOrder,
        page,
        limit: 10
      });

      setTickets(res.data);
      if (res.meta) {
        setTotalPages(res.meta.totalPages || 1);
        setTotalCount(res.meta.total || 0);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tickets.');
    } finally {
      setLoading(false);
    }
  }, [user, search, status, priority, categoryId, slaStatus, assignedStaffId, sortBy, sortOrder, page]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      loadTickets();
    }
  }, [user, authLoading, router, loadTickets]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setPriority('');
    setCategoryId('');
    setSlaStatus('');
    setAssignedStaffId('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {user.role === 'STUDENT' ? 'My Support Requests' : 'Central Ticket Management Queue'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {user.role === 'STUDENT'
              ? 'Track the progress of your submitted queries, verify SLA timers, and provide follow-up information.'
              : 'Manage, claim, assign, and resolve campus administrative requests across all academic departments.'}
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

      {/* Search & Filters Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by ticket # (TKT-2026-xxxxx), subject, or student name..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="createdAt">Sort: Created Date</option>
              <option value="slaDueAt">Sort: SLA Due Date</option>
              <option value="priority">Sort: Priority Level</option>
              <option value="status">Sort: Status</option>
              <option value="ticketNumber">Sort: Ticket ID</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
              title="Toggle Ascending / Descending"
            >
              {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>

            <button
              onClick={handleResetFilters}
              className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1 transition-colors font-semibold"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_STUDENT">Waiting for Student</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="REOPENED">Reopened</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low (72h)</option>
              <option value="MEDIUM">Medium (48h)</option>
              <option value="HIGH">High (24h)</option>
              <option value="URGENT">Urgent (8h)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              SLA Status
            </label>
            <select
              value={slaStatus}
              onChange={(e) => {
                setSlaStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All SLA States</option>
              <option value="WITHIN_SLA">Within SLA (On Track)</option>
              <option value="DUE_SOON">Due Soon (Warning)</option>
              <option value="OVERDUE">Overdue (Breached)</option>
              <option value="MET">Resolved within SLA</option>
              <option value="BREACHED">Resolved Past SLA</option>
            </select>
          </div>

          {user.role !== 'STUDENT' && (
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Ownership
              </label>
              <select
                value={assignedStaffId}
                onChange={(e) => {
                  setAssignedStaffId(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Ownerships</option>
                <option value="me">Assigned to Me</option>
                <option value="unassigned">Unassigned Only</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Table */}
      <TicketListTable
        tickets={tickets}
        role={user.role}
        loading={loading}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={(newPage) => setPage(newPage)}
      />

      <CreateTicketModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onTicketCreated={() => {
          loadTickets();
        }}
      />
    </main>
  );
}

export default function TicketsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        }>
          <TicketsContent />
        </Suspense>
      </div>
    </div>
  );
}
