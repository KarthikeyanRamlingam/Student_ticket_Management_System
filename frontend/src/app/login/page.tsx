'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, ArrowRight, AlertCircle, Loader2, Eye, EyeOff, CheckCircle2, Users, Clock3, ShieldCheck } from 'lucide-react';

const demoAccounts = [
  { label: 'Student', detail: 'Submit and track requests', email: 'student@campusresolve.demo', password: 'Student@123', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { label: 'Support staff', detail: 'Triage and resolve tickets', email: 'staff@campusresolve.demo', password: 'Staff@123', tone: 'bg-sky-50 text-sky-700 border-sky-200' },
  { label: 'Administrator', detail: 'Manage campus operations', email: 'admin@campusresolve.demo', password: 'Admin@123', tone: 'bg-violet-50 text-violet-700 border-violet-200' }
];

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (user) router.replace('/dashboard'); }, [user, router]);

  const signIn = async (nextEmail: string, nextPassword: string) => {
    setError(null);
    setLoading(true);
    try {
      await login(nextEmail, nextPassword);
      router.replace('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'We could not sign you in. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_25px_80px_rgba(15,23,42,.12)] sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.05fr_.95fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 top-12 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500"><GraduationCap className="h-6 w-6" /></div>
            <div><p className="font-extrabold tracking-tight">CampusResolve</p><p className="text-xs text-slate-400">One place for campus support</p></div>
          </div>
          <div className="relative max-w-lg">
            <span className="rounded-full border border-indigo-400/25 bg-indigo-400/10 px-3 py-1 text-xs font-bold text-indigo-200">Built for students and campus teams</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight">Get help without chasing offices or losing track.</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">Send your request to the right department, follow every update, and know exactly when to expect a response.</p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[{ label: 'Clear ownership', Icon: Users }, { label: 'SLA tracking', Icon: Clock3 }, { label: 'Private by design', Icon: ShieldCheck }].map(({ label, Icon }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-3"><Icon className="mb-3 h-5 w-5 text-indigo-300" /><p className="text-xs font-bold">{label}</p></div>
              ))}
            </div>
          </div>
          <p className="relative text-xs text-slate-500">Fast, transparent support for the whole campus community.</p>
        </section>

        <section className="flex items-center justify-center p-5 sm:p-10 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200"><GraduationCap className="h-6 w-6" /></div>
              <p className="font-extrabold text-slate-900">CampusResolve</p>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-500">Sign in with your campus account to continue.</p>

            {error && <div role="alert" className="mt-5 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

            <form className="mt-7 space-y-5" onSubmit={(event) => { event.preventDefault(); signIn(email.trim(), password); }}>
              <div><label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700">Email address</label><input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@campus.edu" className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm shadow-sm placeholder:text-slate-400 focus:border-indigo-500" /></div>
              <div><label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-700">Password</label><div className="relative"><input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 pr-12 text-sm shadow-sm placeholder:text-slate-400 focus:border-indigo-500" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
              <button disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}{loading ? 'Signing in…' : 'Sign in'}</button>
            </form>

            <div className="my-7 flex items-center gap-3"><div className="h-px flex-1 bg-slate-200" /><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Explore the demo</span><div className="h-px flex-1 bg-slate-200" /></div>
            <div className="grid gap-2">
              {demoAccounts.map((account) => <button key={account.email} disabled={loading} onClick={() => { setEmail(account.email); setPassword(account.password); signIn(account.email, account.password); }} className={`flex min-h-12 items-center justify-between rounded-xl border px-3.5 text-left transition-transform hover:-translate-y-0.5 ${account.tone}`}><span><span className="block text-xs font-extrabold">{account.label}</span><span className="text-[11px] opacity-75">{account.detail}</span></span><CheckCircle2 className="h-4 w-4" /></button>)}
            </div>
            <p className="mt-7 text-center text-sm text-slate-500">New student? <Link href="/register" className="font-bold text-indigo-600 hover:text-indigo-700">Create your account</Link></p>
          </div>
        </section>
      </div>
    </main>
  );
}
