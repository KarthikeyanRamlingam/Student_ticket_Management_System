'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Briefcase,
  Shield,
  ArrowRight,
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setError(null);
    setLoading(true);
    setEmail(demoEmail);
    setPassword(demoPass);
    try {
      await login(demoEmail, demoPass);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-600/30 mb-4">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Sign In to CampusResolve
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Student Support, SLA Tracking & Ticket Resolution Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4 sm:px-0">
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Quick Demo Switcher Banner */}
          <div className="mb-6 p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/30">
            <div className="flex items-center gap-2 mb-2 text-indigo-300 font-semibold text-xs">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Recruiter & Interview 1-Click Demo Accounts</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Click any role to test authentic role-based permissions and workflows:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('student@campusresolve.demo', 'Student@123')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-700 hover:border-emerald-500/50 text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-emerald-400">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Aarav (Student)</span>
                  </div>
                  <div className="text-[10px] text-slate-400">STU-2024-001 • Own tickets</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('staff@campusresolve.demo', 'Staff@123')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-700 hover:border-blue-500/50 text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-blue-400">
                    <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                    <span>Priya (Staff - Finance)</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Claims, internal notes, SLA</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('staff.it@campusresolve.demo', 'Staff@123')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-700 hover:border-indigo-500/50 text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-indigo-400">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Rahul (Staff - IT)</span>
                  </div>
                  <div className="text-[10px] text-slate-400">IT & urgent blockers</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@campusresolve.demo', 'Admin@123')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-700 hover:border-purple-500/50 text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-purple-400">
                    <Shield className="w-3.5 h-3.5 text-purple-400" />
                    <span>Dr. Rajesh (Admin)</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Executive dashboard & all queues</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@campusresolve.demo"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-900/90 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-900/90 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-700/80 text-center text-xs text-slate-400">
            <span>New student? </span>
            <Link href="/register" className="font-semibold text-indigo-400 hover:text-indigo-300">
              Register Student Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
