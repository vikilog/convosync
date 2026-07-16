/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Clock, Sparkles } from 'lucide-react';
import { api } from '../lib/api';

type TrialInfo = {
  subscriptionStatus: string;
  displayStatus: string;
  isTrial: boolean;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  trialDaysLeft: number;
  trialExpired: boolean;
  planSlug: string | null;
  planName: string | null;
};

export function TrialBanner() {
  const [trial, setTrial] = useState<TrialInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTrial = useCallback(async () => {
    setLoading(true);
    try {
      const company = (await api.getCompanySettings()) as {
        trial?: TrialInfo;
      };
      setTrial(company.trial ?? null);
    } catch {
      setTrial(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTrial();
    const onCompanyUpdated = () => void loadTrial();
    window.addEventListener('convosync:company-updated', onCompanyUpdated);
    return () => window.removeEventListener('convosync:company-updated', onCompanyUpdated);
  }, [loadTrial]);

  if (loading || !trial) return null;

  if (trial.isTrial) {
    const urgent = trial.trialDaysLeft <= 3;
    return (
      <div
        className={`shrink-0 border-b px-6 py-2.5 flex items-center justify-between gap-4 ${
          urgent
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-emerald-50 border-gray-200 text-emerald-800'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Clock className={`h-4 w-4 shrink-0 ${urgent ? 'text-amber-600' : 'text-emerald-700'}`} />
          <p className="text-sm">
            <span className="font-semibold">Free trial</span>
            {' — '}
            {trial.trialDaysLeft === 0
              ? 'ends today'
              : `${trial.trialDaysLeft} day${trial.trialDaysLeft === 1 ? '' : 's'} left`}
            {trial.planName ? ` · ${trial.planName}` : ' · no plan selected yet'}
          </p>
        </div>
        <a
          href="/settings/wallet"
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            urgent
              ? 'bg-amber-600 text-white hover:bg-amber-700'
              : 'bg-channel-green text-white hover:bg-[#20bd5a]'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Upgrade now
        </a>
      </div>
    );
  }

  if (trial.subscriptionStatus === 'past_due' || trial.trialExpired) {
    return (
      <div className="shrink-0 border-b border-red-200 bg-red-50 px-6 py-2.5 flex items-center justify-between gap-4 text-red-900">
        <div className="flex items-center gap-2.5 min-w-0">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm">
            <span className="font-semibold">Trial expired.</span> Upgrade to restore full access
            to campaigns, messaging, and integrations.
          </p>
        </div>
        <a
          href="/settings/wallet"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
        >
          Upgrade to continue
        </a>
      </div>
    );
  }

  return null;
}
