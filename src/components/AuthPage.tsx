/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Bot,
  Eye,
  EyeOff,
  Instagram,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
} from 'lucide-react';
import { Input } from './ui/input';
import { PRODUCT_LOGO, PRODUCT_NAME } from '../lib/brand';
import { api } from '../lib/api';
import { applyAuthSession, userNeedsOnboarding } from '../lib/session';
import { connectSocket } from '../lib/socket';
import { pathForTab } from '../routes';
import { trackEvent } from '../lib/analytics';

const easeOut = [0.22, 1, 0.36, 1] as const;

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const t = (duration: number) =>
    reduceMotion ? { duration: 0 } : { duration, ease: easeOut };

  useEffect(() => {
    trackEvent('login_started');
  }, []);

  const finishAuth = (res: {
    token: string;
    user?: {
      id: string;
      name: string;
      email: string;
      role: string;
      onboardingCompleted?: boolean;
    };
    workspace?: { id: string; name: string };
    activeWorkspaceId?: string;
  }) => {
    applyAuthSession(res);
    trackEvent('login_complete');
    const wsId = res.activeWorkspaceId ?? res.workspace?.id;
    if (wsId) connectSocket(wsId);
    const returnTo = (location.state as { from?: string } | null)?.from;
    if (userNeedsOnboarding(res.user)) {
      navigate('/onboarding', { replace: true });
      return;
    }
    if (returnTo && returnTo !== '/login') {
      navigate(returnTo, { replace: true });
      return;
    }
    navigate(pathForTab('dashboard'), { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(email.trim().toLowerCase(), password);
      finishAuth(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const channels = [
    { icon: MessageCircle, label: 'WhatsApp' },
    { icon: Instagram, label: 'Instagram' },
    { icon: Mail, label: 'Email' },
    { icon: Bot, label: 'AI agent' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface selection:bg-emerald-100 selection:text-emerald-950">
      {/* Full-bleed grid canvas with a single anchored glow — one centered
          plane instead of a split hero panel + form panel. */}
      <div className="app-grid-bg pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[560px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, #34d399 0%, transparent 65%)' }}
        aria-hidden
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-14">
        <motion.div
          className="mb-7 flex items-center gap-2.5"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={t(0.4)}
        >
          <img src={PRODUCT_LOGO} alt="" className="h-9 w-9 object-contain" />
          <span className="font-display text-xl font-bold tracking-tight text-swiss-ink">
            {PRODUCT_NAME}
          </span>
        </motion.div>

        {/* Floating glass card — translucent material over the grid, per
            Apple's "materials convey hierarchy" (not an opaque panel). */}
        <motion.div
          className="w-full max-w-[400px] rounded-3xl border border-white/60 bg-white/70 p-7 shadow-xl shadow-black/[0.06] backdrop-blur-xl md:p-8"
          initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...t(0.45), delay: reduceMotion ? 0 : 0.06 }}
        >
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            Sign in to your workspace to continue.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
            <label htmlFor="login-email" className="block">
              <span className="text-meta font-bold uppercase tracking-wide text-slate-600">
                Email
              </span>
              <div className="relative mt-1.5">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  autoComplete="email"
                  required
                  disabled={loading}
                  className="h-11 rounded-xl border-swiss-line bg-white/90 pl-10 pr-3 text-sm text-slate-900 shadow-slate-900/5 transition-[border-color,box-shadow] duration-200 placeholder:text-slate-400 focus-visible:border-channel-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-channel-green/25 disabled:opacity-60"
                  placeholder="you@company.com"
                />
              </div>
            </label>

            <label htmlFor="login-password" className="block">
              <span className="text-meta font-bold uppercase tracking-wide text-slate-600">
                Password
              </span>
              <div className="relative mt-1.5">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  minLength={8}
                  disabled={loading}
                  className="h-11 rounded-xl border-swiss-line bg-white/90 pl-10 pr-11 text-sm text-slate-900 shadow-slate-900/5 transition-[border-color,box-shadow] duration-200 placeholder:text-slate-400 focus-visible:border-channel-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-channel-green/25 disabled:opacity-60"
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1.5 top-1/2 inline-flex min-h-9 min-w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-channel-green active:scale-95"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <AnimatePresence mode="wait">
              {error && (
                <motion.p
                  key="login-error"
                  role="alert"
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6, x: 0 }}
                  animate={
                    reduceMotion
                      ? { opacity: 1 }
                      : { opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }
                  }
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: reduceMotion ? 0 : 0.35 }}
                  className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs font-medium text-danger-red"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={loading || reduceMotion ? undefined : { y: -1 }}
              whileTap={loading || reduceMotion ? undefined : { scale: 0.97 }}
              className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-channel-green text-sm font-bold text-white shadow-emerald-600/20 transition-colors duration-200 hover:bg-[#20bd5a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-channel-green disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Signing in…
                </>
              ) : (
                'Log in'
              )}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            New to {PRODUCT_NAME}?{' '}
            <Link
              to="/signup"
              className="cursor-pointer font-semibold text-emerald-700 underline-offset-2 transition-colors duration-200 hover:text-emerald-800 hover:underline"
            >
              Start free trial
            </Link>
          </p>
        </motion.div>

        {/* Real product capabilities, not a fabricated usage stat — the
            card sells trust, the strip states scope. */}
        <motion.div
          className="mt-8 flex items-center gap-5 md:gap-7"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...t(0.4), delay: reduceMotion ? 0 : 0.2 }}
        >
          {channels.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500"
            >
              <Icon className="h-3.5 w-3.5 text-slate-400" aria-hidden />
              {label}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
