'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Shield,
  Briefcase,
  Sparkles
} from 'lucide-react';

export function Navbar() {
  const { user, logout, switchPersona } = useAuth();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const demoPersonas = [
    {
      name: 'Aarav Patel',
      role: 'Student',
      email: 'student@campusresolve.demo',
      badge: 'STU-2024-001',
      icon: <GraduationCap className="w-4 h-4 text-emerald-600" />
    },
    {
      name: 'Priya Sharma',
      role: 'Staff (Finance)',
      email: 'staff@campusresolve.demo',
      badge: 'FIN Dept',
      icon: <Briefcase className="w-4 h-4 text-blue-600" />
    },
    {
      name: 'Rahul Verma',
      role: 'Staff (IT Services)',
      email: 'staff.it@campusresolve.demo',
      badge: 'IT Dept',
      icon: <Briefcase className="w-4 h-4 text-indigo-600" />
    },
    {
      name: 'Dr. Rajesh Sharma',
      role: 'Administrator (Dean)',
      email: 'admin@campusresolve.demo',
      badge: 'Dean Office',
      icon: <Shield className="w-4 h-4 text-purple-600" />
    }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                CampusResolve
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-semibold border border-indigo-100">
                  Support OS
                </span>
              </span>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Student Support & Ticket Management System
              </p>
            </div>
          </Link>
        </div>

        {/* Right side: Persona Switcher & User Profile */}
        <div className="flex items-center gap-3">
          {/* Quick Demo Switcher */}
          <div className="relative">
            <button
              onClick={() => setSwitcherOpen(!switcherOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
              title="Switch demo persona for instant interview evaluation"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin-slow" />
              <span className="hidden md:inline">Demo Switcher:</span>
              <span className="font-bold">{user?.role || 'Guest'}</span>
              <ChevronDown className="w-3 h-3 ml-0.5 text-indigo-500" />
            </button>

            {switcherOpen && (
              <div
                className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2"
                onClick={() => setSwitcherOpen(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-slate-800">1-Click Demo Personas</p>
                  <p className="text-[11px] text-slate-500">Test different role permissions instantly</p>
                </div>
                <div className="space-y-1">
                  {demoPersonas.map((persona) => {
                    const isCurrent = user?.email === persona.email;
                    return (
                      <button
                        key={persona.email}
                        onClick={() => switchPersona(persona.email, persona.role)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          isCurrent
                            ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded bg-slate-100">{persona.icon}</div>
                          <div>
                            <div className="font-semibold">{persona.name}</div>
                            <div className="text-[11px] text-slate-500">{persona.role}</div>
                          </div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                          {persona.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* User Info & Role Badge */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-slate-900 leading-tight">{user.name}</span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {user.role} {user.department ? `• ${user.department.code}` : ''}
                </span>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                {user.name.charAt(0)}
              </div>

              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
