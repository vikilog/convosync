/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, ShieldCheck } from 'lucide-react';
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
      const res = await api.login(email.trim(), password);
      finishAuth(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex selection:bg-emerald-100 selection:text-emerald-950">
      {/* Brand plane — hero signal for ConvoSync */}
      <motion.aside
        className="hidden lg:flex lg:w-[52%] relative overflow-hidden items-center justify-center p-12 xl:p-16"
        style={{
          background:
            'radial-gradient(120% 90% at 10% 0%, #34d399 0%, transparent 55%), radial-gradient(90% 70% at 100% 100%, #059669 0%, transparent 50%), linear-gradient(145deg, #0b3d2e 0%, #14532d 42%, #166534 100%)',
        }}
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={t(0.5)}
      >
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          }}
        />
        <motion.div
          className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-emerald-400/30 blur-3xl"
          animate={
            reduceMotion
              ? undefined
              : { scale: [1, 1.12, 1], opacity: [0.35, 0.5, 0.35] }
          }
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden
        />
        <motion.div
          className="absolute -bottom-20 -right-10 h-80 w-80 rounded-full bg-teal-300/20 blur-3xl"
          animate={
            reduceMotion
              ? undefined
              : { scale: [1.05, 1, 1.05], opacity: [0.25, 0.4, 0.25] }
          }
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden
        />

        <div className="relative z-10 w-full max-w-lg text-white">
          <motion.div
            className="flex items-center gap-3 mb-10"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={t(0.45)}
          >
            <img
              src={PRODUCT_LOGO}
              alt=""
              className="h-14 w-14 object-contain drop-shadow-md"
            />
            <span className="font-display text-4xl xl:text-5xl font-bold tracking-tight">
              {PRODUCT_NAME}
            </span>
          </motion.div>

          <motion.p
            className="text-lg xl:text-xl text-emerald-50/90 leading-relaxed max-w-md"
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...t(0.45), delay: reduceMotion ? 0 : 0.08 }}
          >
            One workspace for WhatsApp, Instagram, and your team inbox.
          </motion.p>

          {/* Product visual — inbox preview, not a card stack of promo chips */}
          <motion.div
            className="mt-12 space-y-3 max-w-sm"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...t(0.5), delay: reduceMotion ? 0 : 0.16 }}
            aria-hidden
          >
            <div className="rounded-2xl rounded-bl-md bg-white/12 backdrop-blur-sm border border-white/15 px-4 py-3 text-sm text-emerald-50/95">
              Hi — can you share the delivery status for order #4821?
            </div>
            <div className="ml-8 rounded-2xl rounded-br-md bg-channel-green text-white px-4 py-3 text-sm shadow-lg shadow-emerald-950/20">
              On the way. ETA 4:30 PM. Anything else I can help with?
            </div>
            <div className="flex items-center gap-2 pt-2 text-xs font-medium text-emerald-100/70">
              <MessageSquare className="w-3.5 h-3.5" />
              Live across channels
              <span className="mx-1 text-emerald-100/40">·</span>
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure workspace
            </div>
          </motion.div>
        </div>
      </motion.aside>

      {/* Form plane */}
      <div
        className="flex-1 flex flex-col min-h-screen relative"
        style={{
          background:
            'linear-gradient(180deg, #f4faf6 0%, #eef7f1 40%, #f8faf9 100%)',
        }}
      >
        <div className="absolute inset-0 app-grid-bg opacity-60 pointer-events-none" />

        <div className="relative z-10 px-6 pt-6 md:px-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 min-h-11 text-sm font-semibold text-slate-500 hover:text-emerald-700 transition-colors duration-200 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-channel-green rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center p-6 md:p-10">
          <motion.div
            className="w-full max-w-[420px]"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={t(0.4)}
          >
            <div className="flex items-center gap-3 mb-8 lg:hidden">
              <img
                src={PRODUCT_LOGO}
                alt=""
                className="h-11 w-11 object-contain"
              />
              <span className="font-display text-2xl font-bold tracking-tight text-slate-900">
                {PRODUCT_NAME}
              </span>
            </div>

            <h1 className="font-display text-2xl md:text-[1.75rem] font-bold text-slate-900 tracking-tight">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Sign in to your workspace to continue.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...t(0.35), delay: reduceMotion ? 0 : 0.06 }}
              >
                <label htmlFor="login-email" className="block">
                  <span className="text-meta font-bold text-slate-600 uppercase tracking-wide">
                    Email
                  </span>
                  <div className="relative mt-1.5">
                    <Mail
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                      aria-hidden
                    />
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                      disabled={loading}
                      className="w-full min-h-11 pl-10 pr-3 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl shadow-sm shadow-slate-900/5 placeholder:text-slate-400 transition-[border-color,box-shadow] duration-200 focus:outline-none focus:ring-2 focus:ring-channel-green/25 focus:border-channel-green disabled:opacity-60"
                      placeholder="you@company.com"
                    />
                  </div>
                </label>
              </motion.div>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...t(0.35), delay: reduceMotion ? 0 : 0.12 }}
              >
                <label htmlFor="login-password" className="block">
                  <span className="text-meta font-bold text-slate-600 uppercase tracking-wide">
                    Password
                  </span>
                  <div className="relative mt-1.5">
                    <Lock
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                      aria-hidden
                    />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      minLength={8}
                      disabled={loading}
                      className="w-full min-h-11 pl-10 pr-11 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl shadow-sm shadow-slate-900/5 placeholder:text-slate-400 transition-[border-color,box-shadow] duration-200 focus:outline-none focus:ring-2 focus:ring-channel-green/25 focus:border-channel-green disabled:opacity-60"
                      placeholder="Your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center min-h-9 min-w-9 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors duration-200 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-channel-green"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </label>
              </motion.div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.p
                    key="login-error"
                    role="alert"
                    initial={
                      reduceMotion
                        ? { opacity: 1 }
                        : { opacity: 0, y: -6, x: 0 }
                    }
                    animate={
                      reduceMotion
                        ? { opacity: 1 }
                        : { opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }
                    }
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: reduceMotion ? 0 : 0.35 }}
                    className="text-xs text-danger-red font-medium bg-red-50 border border-red-100 rounded-xl px-3 py-2.5"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...t(0.35), delay: reduceMotion ? 0 : 0.18 }}
              >
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={loading || reduceMotion ? undefined : { y: -1 }}
                  whileTap={loading || reduceMotion ? undefined : { scale: 0.985 }}
                  className="w-full min-h-12 inline-flex items-center justify-center gap-2 rounded-full bg-channel-green hover:bg-[#20bd5a] text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-channel-green"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                      Signing in…
                    </>
                  ) : (
                    'Log in'
                  )}
                </motion.button>
              </motion.div>
            </form>

            <p className="text-sm text-center text-slate-600 mt-8">
              New to {PRODUCT_NAME}?{' '}
              <Link
                to="/signup"
                className="font-semibold text-emerald-700 hover:text-emerald-800 underline-offset-2 hover:underline cursor-pointer transition-colors duration-200"
              >
                Start free trial
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
