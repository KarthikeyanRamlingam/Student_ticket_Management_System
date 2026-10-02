'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { Priority, TicketMetrics, TicketStatus } from '../../types';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { CreateTicketModal } from '../../components/CreateTicketModal';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { SlaBadge } from '../../components/SlaBadge';
import { ArrowRight, Plus, RefreshCw, Ticket, Clock3, MessageCircleMore, CircleCheckBig, AlertTriangle, Users, Gauge, Sparkles, Building2, Loader2 } from 'lucide-react';

const AdminAnalyticsCharts = dynamic(() => import('../../components/AdminAnalyticsCharts').then((mod) => mod.AdminAnalyticsCharts), { loading: () => <div className="h-72 rounded-3xl skeleton-shimmer" /> });

type DashboardTicket = {
  id: string;
  ticketNumber: string;
  title: string;
  status: TicketStatus;
  priority: Priority;
  category?: { name: string };
  department?: { name: string };
  metrics?: TicketMetrics;
};
type ChartItem = { name?: string; priority?: string; value?: number; count?: number };
type DashboardData = {
  cards?: Record<string, number>;
  actionRequired?: DashboardTicket[];
  recentTickets?: DashboardTicket[];
  recentAssigned?: DashboardTicket[];
  urgentTicketsList?: DashboardTicket[];
  urgentQueue?: DashboardTicket[];
  slaBreaches?: DashboardTicket[];
  charts?: { byDepartment?: ChartItem[]; byPriority?: ChartItem[]; byCategory?: ChartItem[] };
};

type MetricProps = { label: string; value: number | string; hint: string; icon: React.ElementType; tone: string };
function Metric({ label, value, hint, icon: Icon, tone }: MetricProps) {
  return <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.02)] transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">{value}</p></div><span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tone}`}><Icon className="h-5 w-5" /></span></div><p className="mt-2 text-xs text-slate-400">{hint}</p></div>;
}

function EmptyState({ student, onCreate }: { student?: boolean; onCreate?: () => void }) {
  return <div className="flex flex-col items-center px-6 py-14 text-center"><span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500"><Sparkles className="h-6 w-6" /></span><h3 className="text-base font-bold text-slate-900">{student ? 'No support requests yet' : 'Everything is clear'}</h3><p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">{student ? 'When something gets in your way, send a request and follow every update here.' : 'There are no items that need immediate attention.'}</p>{student && <button onClick={onCreate} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white"><Plus className="mr-1.5 inline h-4 w-4" />Ask for help</button>}</div>;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const loadDashboard = useCallback(async (refresh = false) => {
    if (!user) return;
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const endpoint = user.role === 'ADMIN' ? '/analytics/admin' : user.role === 'STAFF' ? '/analytics/staff' : '/analytics/student';
      const response = await api.get<DashboardData>(endpoint);
      setData(response.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'We could not load your overview.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
    if (user) queueMicrotask(() => loadDashboard());
  }, [authLoading, user, router, loadDashboard]);

  if (authLoading || !user) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="h-7 w-7 animate-spin text-indigo-600" /></div>;

  const cards = data?.cards || {};
  const student = user.role === 'STUDENT';
  const staff = user.role === 'STAFF';
  const recent = student ? data?.recentTickets : data?.recentAssigned;
  const urgent = data?.urgentTicketsList || data?.urgentQueue || data?.slaBreaches || [];
  const departmentData = (data?.charts?.byDepartment || []).map((item) => ({ name: item.name || 'General', value: Number(item.value ?? item.count ?? 0) }));
  const priorityData = (data?.charts?.byPriority || []).map((item) => ({ name: item.name || item.priority || 'Normal', value: Number(item.value ?? item.count ?? 0) }));
  const categoryData = (data?.charts?.byCategory || []).map((item) => ({ name: item.name || 'General', value: Number(item.value ?? item.count ?? 0) }));

  return <div className="min-h-screen bg-[#f7f8fc]">
    <Navbar onOpenCreateModal={() => setCreateOpen(true)} />
    <div className="flex"><Sidebar onOpenCreateModal={() => setCreateOpen(true)} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-7 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-7xl space-y-7">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="mb-2 text-xs font-extrabold uppercase tracking-[.16em] text-indigo-600">{student ? 'Your support space' : staff ? user.department?.name || 'Support desk' : 'Campus operations'}</p><h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">{student ? `Hi ${user.name.split(' ')[0]}, how can we help?` : staff ? `Welcome back, ${user.name.split(' ')[0]}` : 'Campus support at a glance'}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{student ? 'Submit a request, see who is helping, and follow progress without chasing different offices.' : staff ? 'Focus on the tickets that need you most and keep students informed.' : 'Monitor service health, workload, and resolution performance across departments.'}</p></div>
            <div className="flex gap-2"><button onClick={() => loadDashboard(true)} disabled={refreshing} className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-600 hover:border-slate-300"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /><span className="hidden sm:inline">Refresh</span></button>{student ? <button onClick={() => setCreateOpen(true)} className="flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700"><Plus className="h-4 w-4" />New request</button> : <Link href="/tickets" className="flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white"><Ticket className="h-4 w-4" />Open queue</Link>}</div>
          </header>

          {error && <div role="alert" className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</span><button onClick={() => loadDashboard()} className="font-bold">Try again</button></div>}

          {loading && !data ? <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map((key) => <div key={key} className="h-36 rounded-2xl skeleton-shimmer" />)}</div><div className="h-80 rounded-3xl skeleton-shimmer" /></div> : <>
            {student && (data?.actionRequired?.length ?? 0) > 0 && (
              <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-amber-400 to-orange-400 p-5 text-amber-950 shadow-lg shadow-amber-200/50 sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/55"><MessageCircleMore className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-extrabold">We need a little more information</h2>
                    <p className="mt-1 text-sm text-amber-900/80">Reply to keep your request moving.</p>
                    <div className="mt-4 flex flex-wrap gap-2">{(data?.actionRequired ?? []).map((ticket) => <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-xs font-bold shadow-sm"><span>{ticket.title}</span><ArrowRight className="h-3.5 w-3.5" /></Link>)}</div>
                  </div>
                </div>
              </section>
            )}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {student && <><Metric label="All requests" value={cards.totalTickets ?? cards.total ?? 0} hint="Everything you've submitted" icon={Ticket} tone="bg-indigo-50 text-indigo-600" /><Metric label="In progress" value={cards.activeTickets ?? 0} hint="Campus teams are working on these" icon={Clock3} tone="bg-sky-50 text-sky-600" /><Metric label="Waiting for you" value={cards.waitingForStudent ?? cards.waitingForMe ?? 0} hint="A reply may be needed" icon={MessageCircleMore} tone="bg-amber-50 text-amber-600" /><Metric label="Resolved" value={cards.resolvedTickets ?? cards.resolved ?? 0} hint="Completed requests" icon={CircleCheckBig} tone="bg-emerald-50 text-emerald-600" /></>}
              {staff && <><Metric label="My active queue" value={cards.assignedToMe ?? 0} hint="Assigned to you" icon={Ticket} tone="bg-indigo-50 text-indigo-600" /><Metric label="Unclaimed" value={cards.openInDepartment ?? 0} hint="Available in your department" icon={Users} tone="bg-sky-50 text-sky-600" /><Metric label="Needs attention" value={cards.urgentTickets ?? 0} hint="Due soon or overdue" icon={AlertTriangle} tone="bg-rose-50 text-rose-600" /><Metric label="Resolved" value={cards.resolvedTickets ?? 0} hint="Your completed tickets" icon={CircleCheckBig} tone="bg-emerald-50 text-emerald-600" /></>}
              {user.role === 'ADMIN' && <><Metric label="Total requests" value={cards.totalTickets ?? cards.total ?? 0} hint="Campus-wide volume" icon={Ticket} tone="bg-indigo-50 text-indigo-600" /><Metric label="Active now" value={cards.activeTickets ?? cards.open ?? 0} hint="Still moving through support" icon={Users} tone="bg-sky-50 text-sky-600" /><Metric label="SLA success" value={`${cards.slaComplianceRate ?? 100}%`} hint="Resolved within target" icon={Gauge} tone="bg-emerald-50 text-emerald-600" /><Metric label="Overdue" value={cards.breachedTickets ?? cards.overdue ?? 0} hint="Requires intervention" icon={AlertTriangle} tone="bg-rose-50 text-rose-600" /></>}
            </section>

            {(student || staff) && <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,.7fr)]"><section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><div><h2 className="font-extrabold text-slate-900">{student ? 'Recent requests' : 'Recently assigned'}</h2><p className="mt-0.5 text-xs text-slate-500">{student ? 'Your latest conversations with campus teams' : 'The latest activity in your queue'}</p></div><Link href="/tickets" className="flex items-center gap-1 text-xs font-bold text-indigo-600">View all <ArrowRight className="h-3.5 w-3.5" /></Link></div>{recent?.length ? <div className="divide-y divide-slate-100">{recent.slice(0,6).map((ticket: any) => <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="min-w-0"><div className="mb-1.5 flex items-center gap-2"><span className="font-mono text-[11px] font-bold text-indigo-600">{ticket.ticketNumber}</span><PriorityBadge priority={ticket.priority} size="sm" /></div><h3 className="truncate text-sm font-bold text-slate-900">{ticket.title}</h3><p className="mt-1 text-xs text-slate-500">{ticket.category?.name} · {ticket.department?.name || 'Campus support'}</p></div><div className="flex shrink-0 items-center gap-2"><StatusBadge status={ticket.status} size="sm" /><ArrowRight className="h-4 w-4 text-slate-300" /></div></Link>)}</div> : <EmptyState student={student} onCreate={() => setCreateOpen(true)} />}</section>
              <aside className="rounded-3xl bg-slate-950 p-6 text-white"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10"><Building2 className="h-5 w-5 text-indigo-300" /></span><h2 className="mt-5 text-lg font-extrabold">{student ? 'What happens next?' : 'Attention queue'}</h2>{student ? <ol className="mt-5 space-y-5">{['We route your request to the right team','A staff member reviews and updates it','You get a clear resolution and history'].map((step, index) => <li key={step} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[11px] font-extrabold">{index+1}</span><p className="text-sm leading-6 text-slate-300">{step}</p></li>)}</ol> : urgent.length ? <div className="mt-4 space-y-2">{urgent.slice(0,5).map((ticket: any) => <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="block rounded-2xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"><div className="flex items-center justify-between gap-2"><span className="font-mono text-[10px] font-bold text-rose-300">{ticket.ticketNumber}</span>{ticket.metrics && <SlaBadge metrics={ticket.metrics} size="sm" />}</div><p className="mt-2 line-clamp-2 text-xs font-bold text-white">{ticket.title}</p></Link>)}</div> : <p className="mt-3 text-sm leading-6 text-slate-400">Nothing urgent right now. Great work keeping the queue healthy.</p>}</aside>
            </div>}

            {user.role === 'ADMIN' && <><AdminAnalyticsCharts departmentData={departmentData} priorityData={priorityData} categoryData={categoryData} />{urgent.length > 0 && <section className="overflow-hidden rounded-3xl border border-rose-200 bg-white"><div className="border-b border-rose-100 bg-rose-50 px-6 py-4"><h2 className="font-extrabold text-rose-900">Tickets needing intervention</h2><p className="mt-1 text-xs text-rose-700">Overdue requests with the highest operational risk</p></div><div className="divide-y divide-slate-100">{urgent.slice(0,6).map((ticket: any) => <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{ticket.title}</p><p className="mt-1 text-xs text-slate-500">{ticket.ticketNumber} · {ticket.department?.name}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-slate-400" /></Link>)}</div></section>}</>}
          </>}
        </div>
      </main>
    </div>
    <CreateTicketModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onTicketCreated={() => { setCreateOpen(false); loadDashboard(true); }} />
  </div>;
}
