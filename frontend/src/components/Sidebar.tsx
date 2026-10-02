'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Ticket, Plus, Inbox, UserCheck, SlidersHorizontal, TimerReset, ArrowUpRight } from 'lucide-react';

interface SidebarProps { onOpenCreateModal?: () => void; }

export function Sidebar({ onOpenCreateModal }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  if (!user) return null;

  const selected = (path: string) => pathname === path || (path === '/tickets' && pathname.startsWith('/tickets/'));
  const item = (path: string) => `group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-all ${selected(path) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`;

  return (
    <>
      <aside className="sticky top-18 hidden h-[calc(100vh-4.5rem)] w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-5 md:flex">
        {user.role === 'STUDENT' && onOpenCreateModal && <button onClick={onOpenCreateModal} className="mb-6 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-transform hover:-translate-y-0.5 hover:bg-indigo-700"><Plus className="h-4 w-4" /> Ask for help</button>}

        <nav aria-label="Primary" className="space-y-1">
          <Link href="/dashboard" className={item('/dashboard')}><LayoutDashboard className="h-5 w-5" /><span>Home</span></Link>
          <Link href="/tickets" className={item('/tickets')}><Ticket className="h-5 w-5" /><span>{user.role === 'STUDENT' ? 'My requests' : 'All tickets'}</span></Link>
        </nav>

        {user.role === 'STAFF' && <div className="mt-7"><p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">Work queues</p><nav className="space-y-1"><Link href="/tickets?assignedStaffId=me" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"><UserCheck className="h-5 w-5 text-emerald-500" />Assigned to me</Link><Link href="/tickets?assignedStaffId=unassigned" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"><Inbox className="h-5 w-5 text-amber-500" />Unclaimed</Link></nav></div>}

        {user.role === 'ADMIN' && <div className="mt-7"><p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">Manage</p><nav className="space-y-1"><Link href="/categories" className={item('/categories')}><SlidersHorizontal className="h-5 w-5" />Categories & SLAs</Link><Link href="/tickets?slaStatus=OVERDUE" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"><TimerReset className="h-5 w-5 text-rose-500" />SLA attention</Link></nav></div>}

        <div className="mt-auto rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 p-4"><div className="mb-2 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /><span className="text-xs font-bold text-slate-700">Support is online</span></div><p className="text-[11px] leading-5 text-slate-500">Requests are automatically routed to the right campus team.</p><Link href="/tickets" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600">View activity <ArrowUpRight className="h-3 w-3" /></Link></div>
      </aside>

      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-slate-200 bg-white/95 px-3 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_32px_rgba(15,23,42,.08)] backdrop-blur-xl md:hidden">
        <Link href="/dashboard" className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-bold ${selected('/dashboard') ? 'text-indigo-600' : 'text-slate-400'}`}><LayoutDashboard className="h-5 w-5" />Home</Link>
        {user.role === 'STUDENT' ? (onOpenCreateModal ? <button onClick={onOpenCreateModal} className="mx-auto -mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-200" aria-label="Ask for help"><Plus className="h-6 w-6" /></button> : <Link href="/tickets?create=1" className="mx-auto -mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-200" aria-label="Ask for help"><Plus className="h-6 w-6" /></Link>) : <Link href={user.role === 'ADMIN' ? '/categories' : '/tickets?assignedStaffId=me'} className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-bold text-slate-400"><UserCheck className="h-5 w-5" />Queue</Link>}
        <Link href="/tickets" className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-bold ${selected('/tickets') ? 'text-indigo-600' : 'text-slate-400'}`}><Ticket className="h-5 w-5" />Requests</Link>
      </nav>
    </>
  );
}
