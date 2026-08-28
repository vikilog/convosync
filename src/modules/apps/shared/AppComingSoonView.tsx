/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAppDefinition } from '../../../lib/installedApps';

export function AppComingSoonView({ appId }: { appId: string }) {
  const app = getAppDefinition(appId);
  if (!app) return null;
  const Icon = app.icon;

  return (
    <div className="w-full max-w-lg mx-auto pt-16 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
        style={{ backgroundColor: app.iconBg, color: app.iconColor }}
      >
        <Icon className="w-6 h-6" />
      </div>
      <h1 className="mt-4 text-lg font-semibold text-gray-950">{app.name}</h1>
      <p className="mt-2 text-sm text-swiss-muted leading-relaxed">{app.description}</p>
      <p className="mt-6 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-swiss-muted">
        Screen coming soon
      </p>
    </div>
  );
}
