/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { PRODUCT_LOGO, PRODUCT_NAME } from '../lib/brand';
import { api } from '../lib/api';
import { applyAuthSession, userNeedsOnboarding } from '../lib/session';
import { connectSocket } from '../lib/socket';
import { pathForTab } from '../routes';
import { trackEvent } from '../lib/analytics';

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen bg-slate-50 flex selection:bg-sky-50">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-brand-gradient items-center justify-center p-12">
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="relative z-10 max-w-md text-white">
          <img
            src={PRODUCT_LOGO}
            alt={PRODUCT_NAME}
            className="h-14 w-14 mb-8 object-contain"
          />
          <h1 className="text-3xl font-black tracking-tight leading-tight">
            Welcome back to ConvoSync
          </h1>
          <p className="mt-4 text-white/80 text-sm leading-relaxed">
            Sign in to manage inbox, campaigns, AI agents, and your connected channels from one
            workspace.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-screen">
        <div className="px-6 pt-6 md:px-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-[400px]">
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <img src={PRODUCT_LOGO} alt={PRODUCT_NAME} className="h-12 w-12 object-contain" />
            </div>

            <h2 className="text-xl font-bold text-gray-900">Log in to your workspace</h2>
            <p className="text-xs text-gray-400 mt-1 mb-6">
              Enter your email and password to continue.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-meta font-bold text-gray-500 uppercase tracking-wide">
                  Email
                </span>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="you@company.com"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-meta font-bold text-gray-500 uppercase tracking-wide">
                  Password
                </span>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    minLength={8}
                    className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-primary cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </label>

              {error && (
                <p className="text-xs text-danger-red font-medium bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-channel-green hover:bg-[#20bd5a] text-white text-sm font-bold transition-all disabled:opacity-60 shadow-sm cursor-pointer"
              >
                {loading ? 'Please wait…' : 'Log in'}
              </button>
            </form>

            <p className="text-sm text-center text-gray-500 mt-6">
              New to ConvoSync?{' '}
              <Link to="/signup" className="font-semibold text-primary hover:underline cursor-pointer">
                Start free trial
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
