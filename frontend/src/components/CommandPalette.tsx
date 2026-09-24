'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Ticket as TicketIcon, LayoutDashboard, FolderTree, UserCheck, Plus, Sparkles, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { Ticket } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateTicket?: () => void;
}

export function CommandPalette({ isOpen, onClose, onOpenCreateTicket }: Props) {
  const router = useRouter();
  const { switchPersona, user } = useAuth();
  const { success } = useToast();
  const [query, setQuery] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled externally
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && query.trim().length >= 2) {
      setLoading(true);
      const timer = setTimeout(() => {
        api.get<{ tickets: Ticket[] }>(`/tickets?search=${encodeURIComponent(query.trim())}&limit=5`)
          .then((res) => setTickets(res.data.tickets || []))
          .catch(() => setTickets([]))
          .finally(() => setLoading(false));
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setTickets([]);
      setLoading(false);
    }
  }, [query, isOpen]);

  if (!isOpen) return null;

  const navigateTo = (path: string) => {
    router.push(path);
    onClose();
  };

  const handleDemoSwitch = async (email: string, roleDescription: string) => {
    await switchPersona(email, roleDescription);
    success('Switched Persona', `Now browsing as ${roleDescription}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200">
          <Search className="w-5 h-5 text-indigo-600 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type ticket #, issue keyword, student name, or command..."
            className="w-full text-sm font-medium text-slate-900 bg-transparent border-none outline-none placeholder:text-slate-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results / Commands Scrollable Area */}
        <div className="overflow-y-auto p-3 space-y-4">
          {/* Quick Ticket Results */}
          {loading && (
            <div className="p-4 text-center text-xs text-slate-500 font-medium">Searching tickets...</div>
          )}

          {tickets.length > 0 && (
            <div>
              <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Matching Tickets
              </p>
              <div className="space-y-1">
                {tickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => navigateTo(`/tickets/${t.id}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/80 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <TicketIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div className="truncate">
                        <span className="font-mono text-xs font-bold text-indigo-700 mr-2">{t.ticketNumber}</span>
                        <span className="text-xs text-slate-800 font-medium">{t.title}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Navigation Commands */}
          <div>
            <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Quick Navigation
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <button
                onClick={() => navigateTo('/dashboard')}
                className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-500" />
                <span>Executive Dashboard</span>
              </button>
              <button
                onClick={() => navigateTo('/tickets')}
                className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
              >
                <TicketIcon className="w-4 h-4 text-slate-500" />
                <span>Tickets Center</span>
              </button>
              {user?.role === 'ADMIN' && (
                <button
                  onClick={() => navigateTo('/categories')}
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
                >
                  <FolderTree className="w-4 h-4 text-slate-500" />
                  <span>Category & SLA Manager</span>
                </button>
              )}
              {onOpenCreateTicket && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenCreateTicket();
                  }}
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-indigo-50 text-xs font-semibold text-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4 text-indigo-600" />
                  <span>Submit New Ticket</span>
                </button>
              )}
            </div>
          </div>

          {/* Persona Switcher Quick Actions */}
          <div>
            <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Switch Persona Instantly</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleDemoSwitch('student@campusresolve.demo', 'Student')}
                className="p-2 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-left transition-all"
              >
                <div className="text-[11px] font-bold text-slate-800">Aarav Patel</div>
                <div className="text-[10px] text-slate-500">Student</div>
              </button>
              <button
                onClick={() => handleDemoSwitch('staff@campusresolve.demo', 'Staff (Finance)')}
                className="p-2 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-left transition-all"
              >
                <div className="text-[11px] font-bold text-slate-800">Priya Sharma</div>
                <div className="text-[10px] text-indigo-600">Finance Staff</div>
              </button>
              <button
                onClick={() => handleDemoSwitch('staff.it@campusresolve.demo', 'Staff (IT Services)')}
                className="p-2 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-left transition-all"
              >
                <div className="text-[11px] font-bold text-slate-800">Rahul Verma</div>
                <div className="text-[10px] text-indigo-600">IT Staff</div>
              </button>
              <button
                onClick={() => handleDemoSwitch('admin@campusresolve.demo', 'Administrator (Dean)')}
                className="p-2 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-left transition-all"
              >
                <div className="text-[11px] font-bold text-slate-800">Dr. Rajesh</div>
                <div className="text-[10px] text-purple-600">Dean / Admin</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer tip */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>ProTip: Press <kbd className="px-1.5 py-0.5 font-semibold bg-white border border-slate-200 rounded">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 font-semibold bg-white border border-slate-200 rounded">K</kbd> anywhere to open</span>
          <span className="font-medium text-indigo-600">CampusResolve v2.0 Enterprise</span>
        </div>
      </div>
    </div>
  );
}
