/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FormEvent, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { trackEvent } from '../../lib/analytics';
import { LandingSection, LandingSectionHeader } from './landing-ui';

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20';

export default function BookDemoSection() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.submitDemoRequest({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        message: message.trim() || undefined,
        source: 'landing',
      });
      trackEvent('demo_request_submit', { source: 'landing' });
      setDone(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LandingSection id="book-demo" tone="soft">
      <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,420px)] lg:items-start">
        <LandingSectionHeader
          badge="Talk to us"
          title="Book a demo"
          titleAccent="See ConvoSync in 15 minutes."
          description="Share a few details and we’ll reach out to schedule a walkthrough of inbox, campaigns, and AI agents."
          align="left"
          className="mb-0 lg:pr-8"
        />

        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-sm">
          {done ? (
            <div className="flex flex-col items-center text-center py-8 px-2">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-channel-green">
                <CheckCircle2 className="h-6 w-6" aria-hidden />
              </span>
              <h3 className="text-lg font-bold text-gray-950">Request received</h3>
              <p className="mt-2 text-sm text-gray-600 max-w-sm">
                Thanks — we’ll email you shortly to lock a demo slot.
              </p>
              <button
                type="button"
                onClick={() => setDone(false)}
                className="mt-5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                Submit another
              </button>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3.5">
              <div>
                <label htmlFor="demo-name" className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="demo-name"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="demo-email" className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Work email <span className="text-red-500">*</span>
                </label>
                <input
                  id="demo-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label htmlFor="demo-phone" className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Phone <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  id="demo-phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  placeholder="+91 …"
                />
              </div>
              <div>
                <label htmlFor="demo-message" className="mb-1.5 block text-xs font-semibold text-gray-700">
                  What do you want to see?{' '}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  id="demo-message"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                  className={`${inputClass} resize-none`}
                  placeholder="e.g. WhatsApp inbox + campaigns for my store"
                />
              </div>

              {error && (
                <p className="text-sm font-medium text-red-600" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-channel-green hover:bg-[#20bd5a] disabled:opacity-60 text-white text-sm font-bold px-5 py-3 shadow-md shadow-emerald-600/15 transition-all cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Sending…
                  </>
                ) : (
                  'Book a demo'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </LandingSection>
  );
}
