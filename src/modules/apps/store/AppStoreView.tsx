/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Lock } from 'lucide-react';
import { pathForTab } from '../../../routes';
import {
  APP_REGISTRY,
  APPS_CHANGED_EVENT,
  getInstalledAppIds,
  installApp,
  refreshInstalledApps,
  type AppDefinition,
} from '../../../lib/installedApps';

function AppCard({
  app,
  installed,
  onOpen,
  onView,
}: {
  app: AppDefinition;
  installed: boolean;
  onOpen: () => void;
  onView: () => void;
}) {
  const Icon = app.icon;
  return (
    <article className="bg-white rounded-2xl border border-swiss-line p-5 flex flex-col h-full shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: app.iconBg, color: app.iconColor }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-950 leading-tight truncate">{app.name}</h3>
          <span className="text-[11px] font-bold uppercase tracking-wide text-swiss-faint">
            {app.category}
          </span>
        </div>
      </div>
      <p className="mt-3 text-xs text-swiss-muted font-medium leading-relaxed flex-1">
        {app.description}
      </p>
      <div className="mt-4 flex gap-2">
        {installed ? (
          <>
            <div className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-[#e6fcef] text-primary">
              <Check className="w-3.5 h-3.5" />
              Installed
            </div>
            <button
              type="button"
              onClick={onOpen}
              className="px-3 py-2 rounded-lg text-sm font-bold border border-border-subtle text-swiss-muted hover:bg-black/[0.03]"
            >
              Open
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onView}
            className="w-full px-3 py-2 rounded-lg text-sm font-bold bg-primary hover:bg-primary-hover text-white transition-colors"
          >
            Install
          </button>
        )}
      </div>
    </article>
  );
}

function InstallConfirmPanel({
  app,
  installed,
  onBack,
  onInstalled,
}: {
  app: AppDefinition;
  installed: boolean;
  onBack: () => void;
  onInstalled: () => void;
}) {
  const [installing, setInstalling] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);
  const [error, setError] = useState('');
  const Icon = app.icon;

  const handleInstall = async () => {
    setInstalling(true);
    setError('');
    try {
      await installApp(app.id);
      setJustInstalled(true);
      setTimeout(() => onInstalled(), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to install');
      setInstalling(false);
    }
  };

  return (
    <div className="w-full pb-12 max-w-2xl mx-auto">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-swiss-muted hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to App Store
      </button>

      <div className="mt-5 bg-white rounded-2xl border border-swiss-line p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: app.iconBg, color: app.iconColor }}
          >
            <Icon className="w-5.5 h-5.5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-950">{app.name}</h2>
            <p className="text-xs text-swiss-muted font-medium mt-0.5">
              By {app.by} · {app.category}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-[11px] font-bold uppercase tracking-wide text-swiss-faint mb-2">
            About this app
          </h4>
          <p className="text-sm text-swiss-muted leading-relaxed">{app.about}</p>
        </div>

        <div className="mt-6">
          <h4 className="text-[11px] font-bold uppercase tracking-wide text-swiss-faint mb-2.5">
            What you'll get
          </h4>
          <ul className="flex flex-col gap-2.5">
            {app.whatYouGet.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[13.5px] text-swiss-ink leading-snug">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6">
          <h4 className="text-[11px] font-bold uppercase tracking-wide text-swiss-faint mb-2.5">
            Permissions requested
          </h4>
          <ul className="flex flex-col gap-2">
            {app.permissions.map((perm) => (
              <li key={perm.title} className="flex items-start gap-2.5 rounded-lg bg-slate-50 px-3 py-2.5">
                <Lock className="w-4 h-4 text-swiss-faint shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-bold text-swiss-ink">{perm.title}</p>
                  <p className="text-xs text-swiss-muted mt-0.5">{perm.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <p className="mt-4 text-xs font-bold text-danger-red bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="mt-7 flex gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 rounded-xl border border-border-subtle text-sm font-bold text-swiss-muted hover:bg-black/[0.03]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={installed || installing}
            onClick={handleInstall}
            className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-70 text-white text-sm font-bold rounded-xl transition-all inline-flex items-center justify-center gap-1.5"
          >
            {justInstalled ? (
              <>
                <Check className="w-4 h-4" />
                Installed
              </>
            ) : installed ? (
              'Already installed'
            ) : (
              'Install App'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppStoreView() {
  const navigate = useNavigate();
  const [installedIds, setInstalledIds] = useState<string[]>(() => getInstalledAppIds());
  const [category, setCategory] = useState<string>('All apps');
  const [openAppId, setOpenAppId] = useState<string | null>(null);

  useEffect(() => {
    const syncFromCache = () => setInstalledIds(getInstalledAppIds());
    void refreshInstalledApps().then(syncFromCache).catch(() => {});
    window.addEventListener(APPS_CHANGED_EVENT, syncFromCache);
    return () => window.removeEventListener(APPS_CHANGED_EVENT, syncFromCache);
  }, []);

  const categories = useMemo(
    () => ['All apps', ...Array.from(new Set(APP_REGISTRY.map((a) => a.category)))],
    []
  );

  const visibleApps = useMemo(
    () => APP_REGISTRY.filter((app) => category === 'All apps' || app.category === category),
    [category]
  );

  const openApp = useMemo(() => APP_REGISTRY.find((a) => a.id === openAppId) ?? null, [openAppId]);

  if (openApp) {
    return (
      <InstallConfirmPanel
        app={openApp}
        installed={installedIds.includes(openApp.id)}
        onBack={() => setOpenAppId(null)}
        onInstalled={() => navigate(pathForTab(openApp.tab))}
      />
    );
  }

  return (
    <div className="w-full pb-12 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-950">App Store</h1>
        <p className="text-xs text-swiss-muted font-medium mt-1 max-w-lg">
          Add capabilities built for your business. Every app is first-party — install with one
          click, no setup outside ConvoSync.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-full text-[13px] font-bold border transition-colors ${
              category === c
                ? 'bg-primary border-primary text-white'
                : 'bg-white border-border-subtle text-swiss-muted hover:bg-black/[0.03]'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleApps.map((app) => (
          <AppCard
            key={app.id}
            app={app}
            installed={installedIds.includes(app.id)}
            onOpen={() => navigate(pathForTab(app.tab))}
            onView={() => setOpenAppId(app.id)}
          />
        ))}
      </div>
    </div>
  );
}
