/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { Gauge, Loader2 } from 'lucide-react';
import { api, formatCatchError } from '../../lib/api';
import { formatCc, inrToCc } from '../../lib/convocoins';

type UsageRow = {
  feature: string;
  billing: string;
  usage: string;
  usageClass?: string;
};

type BillingWorkspace = {
  usageSnapshot?: {
    teamMembers?: { used: number };
    channels?: { used: number };
    campaigns?: { used: number };
  } | null;
};

type UsageCostResponse = {
  whatsapp?: { totalConversations?: number; billedCostInr?: number };
  ai?: { totalTokens?: number; billedCostInr?: number };
  email?: { sent?: number; billedCostInr?: number };
};

type WalletSummary = {
  monthSpentInr?: number;
};

const INCLUDED_ROWS: Array<{ feature: string; billing: string; usage: string }> = [
  { feature: 'WhatsApp Inbox', billing: 'Included in plan', usage: 'Unlimited' },
  { feature: 'Instagram Inbox', billing: 'Included in plan', usage: 'Unlimited' },
  { feature: 'Campaigns & journeys', billing: 'Included in plan', usage: 'Unlimited' },
  { feature: 'Templates', billing: 'Included in plan', usage: 'Unlimited' },
  { feature: 'AI Agent (platform)', billing: 'Included in plan', usage: 'Unlimited agents' },
  { feature: 'Team members', billing: 'Included in plan', usage: 'Unlimited' },
  { feature: 'Inbox messages', billing: 'Included in plan', usage: 'Unlimited' },
];

function ccLabel(inr: number): string {
  if (inr <= 0) return '0 CC';
  return formatCc(inrToCc(inr));
}

export function UsageMeteringSection({ refreshKey = 0 }: { refreshKey?: number }) {
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthSpentCc, setMonthSpentCc] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [billingRes, usageRes, walletRes] = await Promise.all([
        api.getBillingWorkspace(),
        api.getUsageCost(),
        api.getBillingWallet(),
      ]);

      const billing = billingRes as BillingWorkspace;
      const usage = usageRes as UsageCostResponse;
      const wallet = walletRes as WalletSummary;
      const snapshot = billing.usageSnapshot;

      setMonthSpentCc(inrToCc(wallet.monthSpentInr ?? 0));

      const teamUsed = snapshot?.teamMembers?.used ?? 0;
      const channelsUsed = snapshot?.channels?.used ?? 0;
      const campaignsUsed = snapshot?.campaigns?.used ?? 0;

      const included: UsageRow[] = INCLUDED_ROWS.map((row) => {
        if (row.feature === 'Team members') {
          return { ...row, usage: `${teamUsed.toLocaleString('en-IN')} active` };
        }
        return { ...row };
      });

      included.splice(4, 0, {
        feature: 'Connected channels',
        billing: 'Included in plan',
        usage: `${channelsUsed.toLocaleString('en-IN')} connected`,
      });

      if (campaignsUsed > 0) {
        const campaignRow = included.find((r) => r.feature === 'Campaigns & journeys');
        if (campaignRow) {
          campaignRow.usage = `${campaignsUsed.toLocaleString('en-IN')} this month`;
        }
      }

      const waConvos = usage.whatsapp?.totalConversations ?? 0;
      const waCc = usage.whatsapp?.billedCostInr ?? 0;
      const aiTokens = usage.ai?.totalTokens ?? 0;
      const aiCc = usage.ai?.billedCostInr ?? 0;
      const emailsSent = usage.email?.sent ?? 0;
      const emailCc = usage.email?.billedCostInr ?? 0;

      const metered: UsageRow[] = [
        {
          feature: 'WhatsApp templates',
          billing: 'ConvoCoins (metered)',
          usage:
            waConvos > 0
              ? `${waConvos.toLocaleString('en-IN')} sent · ${ccLabel(waCc)}`
              : 'No usage yet',
          usageClass: waCc > 0 ? 'text-amber-700 font-semibold' : undefined,
        },
        {
          feature: 'AI responses',
          billing: 'ConvoCoins (metered)',
          usage:
            aiTokens > 0
              ? `${aiTokens.toLocaleString('en-IN')} tokens · ${ccLabel(aiCc)}`
              : 'No usage yet',
          usageClass: aiCc > 0 ? 'text-amber-700 font-semibold' : undefined,
        },
        {
          feature: 'Email sends',
          billing: 'ConvoCoins (metered)',
          usage:
            emailsSent > 0
              ? `${emailsSent.toLocaleString('en-IN')} sent · ${ccLabel(emailCc)}`
              : 'No usage yet',
          usageClass: emailCc > 0 ? 'text-amber-700 font-semibold' : undefined,
        },
      ];

      setRows([...included, ...metered]);
    } catch (err) {
      setError(formatCatchError(err));
      setRows(INCLUDED_ROWS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <section className="rounded-xl border border-black/5 bg-surface p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] md:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <Gauge className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Usage & limits</h3>
            <p className="mt-0.5 text-sm text-slate-500">
              Platform features are included in ConvoSync Pro. Metered usage is billed from
              ConvoCoins.
            </p>
          </div>
        </div>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
          This month: {formatCc(monthSpentCc)} spent
        </span>
      </div>

      {error ? (
        <p className="mb-3 text-sm text-red-600">{error}</p>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-10 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Feature</th>
                <th className="px-4 py-3">Billing</th>
                <th className="px-4 py-3">This month</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.feature} className="bg-surface">
                  <td className="px-4 py-3 font-medium text-slate-900">{row.feature}</td>
                  <td className="px-4 py-3 text-slate-600">{row.billing}</td>
                  <td className={`px-4 py-3 text-slate-600 ${row.usageClass ?? ''}`}>
                    {row.usage}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
