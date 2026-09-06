/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Eye, EyeOff, KeyRound, Loader2, Lock, Mail } from 'lucide-react';
import { Input } from './ui/input';
import { PRODUCT_LOGO, PRODUCT_NAME } from '../lib/brand';
import { api, formatCatchError } from '../lib/api';

const easeOut = [0.22, 1, 0.36, 1] as const;

type Step = 'request' | 'verify' | 'reset';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<Step>('request');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const t = (duration: number) =>
    reduceMotion ? { duration: 0 } : { duration, ease: easeOut };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.forgotPassword(email.trim().toLowerCase());
      setStep('verify');
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.verifyResetCode({ email: email.trim().toLowerCase(), code: code.trim() });
      setResetToken(res.resetToken);
      setStep('reset');
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!resetToken) {
      setError('Reset session expired. Request a new code.');
      setStep('request');
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword({ resetToken, newPassword });
      navigate('/login', { replace: true, state: { passwordReset: true } });
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface selection:bg-emerald-100 selection:text-emerald-950">
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

        <motion.div
          className="w-full max-w-[400px] rounded-3xl border border-white/60 bg-white/70 p-7 shadow-xl shadow-black/[0.06] backdrop-blur-xl md:p-8"
          initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...t(0.45), delay: reduceMotion ? 0 : 0.06 }}
        >
          {step === 'request' && (
            <>
              <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                Reset your password
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                Enter your account email and we'll send you a reset code.
              </p>

              <form onSubmit={handleRequestCode} className="mt-7 space-y-4" noValidate>
                <label htmlFor="forgot-email" className="block">
                  <span className="text-meta font-bold uppercase tracking-wide text-slate-600">
                    Email
                  </span>
                  <div className="relative mt-1.5">
                    <Mail
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden
                    />
                    <Input
                      id="forgot-email"
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

                <ErrorBanner error={error} reduceMotion={!!reduceMotion} />

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
                      Sending code…
                    </>
                  ) : (
                    'Send reset code'
                  )}
                </motion.button>
              </form>
            </>
          )}

          {step === 'verify' && (
            <>
              <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                Enter your code
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                We sent a 6-digit code to {email}. It expires shortly.
              </p>

              <form onSubmit={handleVerifyCode} className="mt-7 space-y-4" noValidate>
                <label htmlFor="reset-code" className="block">
                  <span className="text-meta font-bold uppercase tracking-wide text-slate-600">
                    Reset code
                  </span>
                  <div className="relative mt-1.5">
                    <KeyRound
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden
                    />
                    <Input
                      id="reset-code"
                      type="text"
                      inputMode="numeric"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      autoComplete="one-time-code"
                      required
                      autoFocus
                      disabled={loading}
                      className="h-11 rounded-xl border-swiss-line bg-white/90 pl-10 pr-3 text-sm tracking-widest text-slate-900 shadow-slate-900/5 transition-[border-color,box-shadow] duration-200 placeholder:text-slate-400 placeholder:tracking-normal focus-visible:border-channel-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-channel-green/25 disabled:opacity-60"
                      placeholder="123456"
                    />
                  </div>
                </label>

                <ErrorBanner error={error} reduceMotion={!!reduceMotion} />

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
                      Verifying…
                    </>
                  ) : (
                    'Verify code'
                  )}
                </motion.button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('request');
                    setError(null);
                    setCode('');
                  }}
                  disabled={loading}
                  className="w-full cursor-pointer text-center text-xs font-semibold text-slate-500 underline-offset-2 transition-colors duration-200 hover:text-emerald-700 hover:underline disabled:opacity-60"
                >
                  Use a different email
                </button>
              </form>
            </>
          )}

          {step === 'reset' && (
            <>
              <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                Set a new password
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                Code verified. Choose a new password for your account.
              </p>

              <form onSubmit={handleResetPassword} className="mt-7 space-y-4" noValidate>
                <label htmlFor="new-password" className="block">
                  <span className="text-meta font-bold uppercase tracking-wide text-slate-600">
                    New password
                  </span>
                  <div className="relative mt-1.5">
                    <Lock
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden
                    />
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      autoFocus
                      minLength={8}
                      disabled={loading}
                      className="h-11 rounded-xl border-swiss-line bg-white/90 pl-10 pr-11 text-sm text-slate-900 shadow-slate-900/5 transition-[border-color,box-shadow] duration-200 placeholder:text-slate-400 focus-visible:border-channel-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-channel-green/25 disabled:opacity-60"
                      placeholder="At least 8 characters"
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

                <label htmlFor="confirm-password" className="block">
                  <span className="text-meta font-bold uppercase tracking-wide text-slate-600">
                    Confirm new password
                  </span>
                  <div className="relative mt-1.5">
                    <Lock
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden
                    />
                    <Input
                      id="confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      disabled={loading}
                      className="h-11 rounded-xl border-swiss-line bg-white/90 pl-10 pr-3 text-sm text-slate-900 shadow-slate-900/5 transition-[border-color,box-shadow] duration-200 placeholder:text-slate-400 focus-visible:border-channel-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-channel-green/25 disabled:opacity-60"
                      placeholder="Re-enter new password"
                    />
                  </div>
                </label>

                <ErrorBanner error={error} reduceMotion={!!reduceMotion} />

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
                      Resetting…
                    </>
                  ) : (
                    'Reset password'
                  )}
                </motion.button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-slate-600">
            Remembered it?{' '}
            <Link
              to="/login"
              className="cursor-pointer font-semibold text-emerald-700 underline-offset-2 transition-colors duration-200 hover:text-emerald-800 hover:underline"
            >
              Back to log in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function ErrorBanner({ error, reduceMotion }: { error: string | null; reduceMotion: boolean }) {
  return (
    <AnimatePresence mode="wait">
      {error && (
        <motion.p
          key="reset-error"
          role="alert"
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6, x: 0 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: reduceMotion ? 0 : 0.35 }}
          className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs font-medium text-danger-red"
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
