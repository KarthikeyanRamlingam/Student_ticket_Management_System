'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  LogOut,
  ChevronDown,
  Shield,
  Briefcase,
  Sparkles,
  Search,
  Bell,
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';
import { CommandPalette } from './CommandPalette';

interface NavbarProps {
  onOpenCreateModal?: () => void;
}

export function Navbar({ onOpenCreateModal }: NavbarProps) {
  const { user, logout, switchPersona } = useAuth();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const demoPersonas = [
    {
      name: 'Aarav Patel',
      role: 'Student',
      email: 'student@campusresolve.demo',
      badge: 'STU-2024-001',
      avatar: 'AP',
      bg: 'from-emerald-500 to-teal-600',
      icon: <GraduationCap className="w-4 h-4 text-emerald-600" />
    },
    {
      name: 'Priya Sharma',
      role: 'Staff (Finance)',
      email: 'staff@campusresolve.demo',
      badge: 'FIN Dept',
      avatar: 'PS',
      bg: 'from-blue-600 to-indigo-600',
      icon: <Briefcase className="w-4 h-4 text-blue-600" />
    },
    {
      name: 'Rahul Verma',
      role: 'Staff (IT Services)',
      email: 'staff.it@campusresolve.demo',
      badge: 'IT Dept',
      avatar: 'RV',
      bg: 'from-indigo-600 to-purple-600',
      icon: <Briefcase className="w-4 h-4 text-indigo-600" />
    },
    {
      name: 'Dr. Rajesh Sharma',
      role: 'Administrator (Dean)',
      email: 'admin@campusresolve.demo',
      badge: 'Dean Office',
      avatar: 'RS',
      bg: 'from-purple-600 to-pink-600',
      icon: <Shield className="w-4 h-4 text-purple-600" />
    }
  ];

  const recentNotifications = [
    {
      id: '1',
      title: 'SLA Escalation Alert',
      desc: 'Ticket #CR-2026-0042 (Hostel Maintenance) breached 24h SLA',
      time: '10m ago',
      unread: true,
      type: 'warning'
    },
    {
      id: '2',
      title: 'Resolution Approved',
      desc: 'Fee refund ticket marked RESOLVED by Finance Dept',
      time: '1h ago',
      unread: false,
      type: 'success'
    },
    {
      id: '3',
      title: 'New Student Submission',
      desc: 'Aarav submitted "Duplicate ID Card Issuance Request"',
      time: '2h ago',
      unread: false,
      type: 'info'
    }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Platform Tag */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 group-hover:shadow-indigo-500/30 transition-all">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900 tracking-tight">CampusResolve</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                    SaaS v2.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  Enterprise Student Support & SLA Resolution
                </p>
              </div>
            </Link>
          </div>

          {/* Center: Command Palette Trigger */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-slate-500 bg-slate-100/80 hover:bg-slate-100 hover:border-slate-300 border border-slate-200/80 rounded-xl transition-all shadow-xs group"
            >
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                <span>Search tickets, actions, or jump to...</span>
              </span>
              <kbd className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-xs">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Right side: Actions, Notifications, Persona Switcher */}
          <div className="flex items-center gap-2.5">
            {/* Mobile Search Button */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notification Drawer Button */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              </button>

              {notifOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2"
                  onClick={() => setNotifOpen(false)}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900">Live Operational Feed</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                      3 Updates
                    </span>
                  </div>
                  <div className="space-y-2">
                    {recentNotifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-xl border text-xs transition-colors ${
                          n.unread ? 'bg-indigo-50/40 border-indigo-100' : 'bg-slate-50/50 border-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800">{n.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">{n.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 text-center">
                    <Link
                      href="/tickets"
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                    >
                      <span>View All Tickets</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Demo Switcher */}
            <div className="relative">
              <button
                onClick={() => setSwitcherOpen(!switcherOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/80 rounded-xl transition-all shadow-xs"
                title="Switch demo persona for instant role evaluation"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden lg:inline text-slate-500 font-normal">Persona:</span>
                <span className="font-bold">{user?.role || 'Guest'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
              </button>

              {switcherOpen && (
                <div
                  className="absolute right-0 mt-2 w-76 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2.5 z-50 animate-in fade-in slide-in-from-top-2"
                  onClick={() => setSwitcherOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-100 mb-1.5">
                    <p className="text-xs font-bold text-slate-900">1-Click Role Switcher</p>
                    <p className="text-[11px] text-slate-500">Test multi-tenant RBAC permissions on the fly</p>
                  </div>
                  <div className="space-y-1">
                    {demoPersonas.map((persona) => {
                      const isCurrent = user?.email === persona.email;
                      return (
                        <button
                          key={persona.email}
                          onClick={() => switchPersona(persona.email, persona.role)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                            isCurrent
                              ? 'bg-indigo-50 text-indigo-950 font-bold border border-indigo-200 shadow-xs'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              {persona.icon}
                            </div>
                            <div className="truncate">
                              <div className="font-bold text-slate-900 leading-tight">{persona.name}</div>
                              <div className="text-[10px] text-slate-500 font-medium">{persona.role}</div>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono font-semibold shrink-0">
                            {persona.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Logout */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-indigo-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {user.name.charAt(0)}
                </div>

                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenCreateTicket={onOpenCreateModal}
      />
    </>
  );
}
