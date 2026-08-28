/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { Code2, Database, Webhook, Zap } from 'lucide-react';
import { WebhooksPanel } from './developers/WebhooksPanel';
import { ActionsPanel } from './developers/ActionsPanel';
import { AiSyncPanel } from './developers/AiSyncPanel';
import { api } from '../lib/api';
import {
  planFeatureEnabled,
  planFeaturesFromSubscription,
  type PlanFeatureFlags,
} from '../lib/planEntitlements';
import { PlanUpgradeBanner } from './PlanUpgradeBanner';

type DevSection = 'webhooks' | 'actions' | 'ai-sync';

const SECTIONS: {
  id: DevSection;
  label: string;
  icon: typeof Webhook;
  description: string;
}[] = [
  {
    id: 'webhooks',
    label: 'Webhooks',
    icon: Webhook,
    description: 'Incoming endpoints, outgoing subscriptions, and delivery logs.',
  },
  {
    id: 'actions',
    label: 'Actions',
    icon: Zap,
    description: 'HTTP APIs for AI Agents and Journey Engine.',
  },
  {
    id: 'ai-sync',
    label: 'AI Sync',
    icon: Database,
    description: 'Knowledge health, sync queue, and rebuild.',
  },
];

export const DevelopersView: FC = () => {
  const [section, setSection] = useState<DevSection>('webhooks');
  const [planFeatures, setPlanFeatures] = useState<PlanFeatureFlags | null>(null);
  const active = SECTIONS.find((s) => s.id === section)!;

  useEffect(() => {
    void api
      .getSubscription()
      .then((res: { currentPlan?: PlanFeatureFlags | null }) => {
        setPlanFeatures(planFeaturesFromSubscription(res.currentPlan));
      })
      .catch(() => setPlanFeatures(null));
  }, []);

  const developersAllowed = planFeatureEnabled(planFeatures, 'developers');

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-6xl">
      <aside className="lg:w-56 shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-sky-50 text-primary">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-swiss-ink">Developers</h2>
            <p className="text-xs text-swiss-muted">Integrations & automation</p>
          </div>
        </div>
        <nav className="space-y-1">
          {SECTIONS.map((item) => {
            const Icon = item.icon;
            const isActive = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-primary text-white '
                    : 'text-swiss-muted hover:bg-surface-muted hover:text-primary'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 min-w-0">
        {!developersAllowed ? (
          <PlanUpgradeBanner message="Developers (webhooks, actions, AI sync) is available on Business plan and above." />
        ) : null}
        <header className="mb-4 mt-4">
          <h3 className="text-base font-bold text-swiss-ink">{active.label}</h3>
          <p className="text-xs text-swiss-muted mt-1">{active.description}</p>
        </header>

        {developersAllowed && section === 'webhooks' && <WebhooksPanel />}
        {developersAllowed && section === 'actions' && <ActionsPanel />}
        {developersAllowed && section === 'ai-sync' && <AiSyncPanel />}
      </main>
    </div>
  );
};
