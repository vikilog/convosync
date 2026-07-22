/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Lock, Mail, User } from 'lucide-react';
import { PRODUCT_LOGO, PRODUCT_NAME } from '../lib/brand';
import { api } from '../lib/api';
import { applyAuthSession, userNeedsOnboarding } from '../lib/session';
import { connectSocket } from '../lib/socket';
import { trackEvent } from '../lib/analytics';

export function SignupPage() {
  const navigate = useNavigate();

  useEffect(() => {
    trackEvent('signup_started', { billing: 'monthly' });
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
    trackEvent('signup_complete', { billing: 'monthly' });
    const wsId = res.activeWorkspaceId ?? res.workspace?.id;
    if (wsId) connectSocket(wsId);
    if (userNeedsOnboarding(res.user)) {
      navigate('/onboarding', { replace: true });
      return;
    }
    navigate('/dashboard', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register(name.trim(), email.trim(), password);
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
          <p className="text-sm font-bold uppercase tracking-widest text-white/70">
            14-day free trial
          </p>
          <h1 className="text-3xl font-black tracking-tight leading-tight mt-2">
            Start your ConvoSync workspace in minutes
          </h1>
          <p className="mt-4 text-white/80 text-sm leading-relaxed">
            Create your account, then complete a short setup wizard for your company, goals, and
            workspace preferences. No credit card required.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/90">
            {[
              'Unified WhatsApp, Instagram & team inbox',
              'AI agents and campaign automation',
              'Connect Meta in under 10 minutes',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-300" />
                {item}
              </li>
            ))}
          </ul>
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
          <div className="w-full max-w-[420px]">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <img src={PRODUCT_LOGO} alt={PRODUCT_NAME} className="h-12 w-12 object-contain" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900">Create your free account</h2>
            <p className="text-sm text-gray-500 mt-1 mb-6">
              Sign up to start your trial. You will finish company and workspace details in the next
              steps.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-meta font-bold text-gray-500 uppercase tracking-wide">
                  Your name
                </span>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Vikas Sharma"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-meta font-bold text-gray-500 uppercase tracking-wide">
                  Work email
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
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Min. 8 characters"
                  />
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
                className="w-full py-3 rounded-full bg-channel-green hover:bg-[#20bd5a] text-white text-sm font-bold transition-all disabled:opacity-60 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  'Creating account…'
                ) : (
                  <>
                    <span>Start free trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-meta text-gray-400 text-center mt-4 leading-relaxed">
              No credit card required. By signing up you agree to our{' '}
              <Link to="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>

            <p className="text-sm text-center text-gray-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline cursor-pointer">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
