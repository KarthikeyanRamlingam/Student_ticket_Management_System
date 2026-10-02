'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { CommandPalette } from './CommandPalette';
import { GraduationCap, Search, ChevronDown, LogOut, Sparkles, CircleHelp } from 'lucide-react';

interface NavbarProps { onOpenCreateModal?: () => void; }

const personas = [
  { name: 'Aarav Patel', label: 'Student', email: 'student@campusresolve.demo', color: 'bg-emerald-500' },
  { name: 'Priya Sharma', label: 'Finance staff', email: 'staff@campusresolve.demo', color: 'bg-sky-500' },
  { name: 'Rahul Verma', label: 'IT staff', email: 'staff.it@campusresolve.demo', color: 'bg-indigo-500' },
  { name: 'Dr. Rajesh Sharma', label: 'Administrator', email: 'admin@campusresolve.demo', color: 'bg-violet-500' }
];

export function Navbar({ onOpenCreateModal }: NavbarProps) {
  const { user, logout, switchPersona } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 h-18 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="flex h-full items-center gap-4 px-4 sm:px-6">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3 md:w-56">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200"><GraduationCap className="h-5 w-5" /></div>
            <div className="hidden min-w-0 sm:block"><p className="truncate text-[15px] font-extrabold tracking-tight text-slate-950">CampusResolve</p><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-slate-400">Student support</p></div>
          </Link>

          <button onClick={() => setCommandOpen(true)} className="mx-auto flex min-h-10 w-full max-w-xl items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-left text-sm text-slate-400 transition-colors hover:border-slate-300 hover:bg-white" aria-label="Search tickets and actions">
            <Search className="h-4 w-4 shrink-0" /><span className="truncate">Search tickets or jump to a page</span><kbd className="ml-auto hidden rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-400 sm:block">Ctrl K</kbd>
          </button>

          <div className="flex items-center gap-2">
            <button className="hidden h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-indigo-600 sm:flex" aria-label="Help"><CircleHelp className="h-5 w-5" /></button>
            <div className="relative">
              <button onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} className="flex min-h-11 items-center gap-2 rounded-xl p-1.5 pr-2 hover:bg-slate-100">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-extrabold text-white">{user?.name?.split(' ').map((part) => part[0]).slice(0, 2).join('') || 'U'}</span>
                <span className="hidden text-left lg:block"><span className="block max-w-28 truncate text-xs font-bold text-slate-800">{user?.name}</span><span className="block text-[10px] font-semibold capitalize text-slate-400">{user?.role?.toLowerCase()}</span></span>
                <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10">
                  <div className="border-b border-slate-100 px-3 py-3"><p className="truncate text-sm font-bold text-slate-900">{user?.name}</p><p className="truncate text-xs text-slate-500">{user?.email}</p></div>
                  <div className="py-2"><p className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400"><Sparkles className="mr-1 inline h-3 w-3" /> Demo personas</p>
                    {personas.map((persona) => <button key={persona.email} onClick={() => { setProfileOpen(false); switchPersona(persona.email, persona.label); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-slate-50 ${user?.email === persona.email ? 'bg-indigo-50' : ''}`}><span className={`h-2.5 w-2.5 rounded-full ${persona.color}`} /><span className="min-w-0"><span className="block truncate text-xs font-bold text-slate-800">{persona.name}</span><span className="text-[11px] text-slate-500">{persona.label}</span></span>{user?.email === persona.email && <span className="ml-auto text-[10px] font-bold text-indigo-600">Current</span>}</button>)}
                  </div>
                  <button onClick={logout} className="flex min-h-10 w-full items-center gap-2 rounded-xl border-t border-slate-100 px-3 text-sm font-semibold text-rose-600 hover:bg-rose-50"><LogOut className="h-4 w-4" /> Sign out</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} onOpenCreateTicket={onOpenCreateModal} />
    </>
  );
}
