/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  settingsSectionFromPath,
  pathForSettingsSection,
  type SettingsSection,
} from '../routes';
import {
  SETTINGS_HIDDEN_SECTIONS,
  SETTINGS_NAV,
  SETTINGS_SECTION_TITLES,
} from './settings/settingsNav';
import { api, getUserPermissions, getUserRole, getWorkspaceId } from '../lib/api';
import {
  hasWorkspacePermission,
  settingsSectionPermission,
} from '../lib/workspacePermissions';
import { ProfilePanel } from './settings/ProfilePanel';
import { CompanyInfoPanel } from './settings/CompanyInfoPanel';
import { UsersTeamsPanel } from './settings/UsersTeamsPanel';
import { SettingsPlaceholder } from './settings/SettingsPlaceholder';
import { AiKnowledgePanel } from './settings/AiKnowledgePanel';
import { AiCopilotPanel } from './settings/AiCopilotPanel';
import { WalletPanel } from './settings/WalletPanel';
import { InvoiceLogsPanel } from './settings/InvoiceLogsPanel';
import { fetchWalletBalanceCc, WALLET_BALANCE_EVENT } from '../lib/walletEvents';
import { formatCc } from '../lib/convocoins';
import { ConvoCoinIcon } from './ConvoCoinIcon';

function SettingsPanel({ section }: { section: SettingsSection }) {
  if (section === 'profile') return <ProfilePanel />;
  if (section === 'company-info') {
    return <CompanyInfoPanel key={getWorkspaceId() ?? 'company'} />;
  }
  if (section === 'users') return <UsersTeamsPanel />;
  if (section === 'ai-knowledge') return <AiKnowledgePanel />;
  if (section === 'ai-copilot') return <AiCopilotPanel />;
  if (section === 'wallet') return <WalletPanel />;
  if (section === 'invoices') return <InvoiceLogsPanel />;
  return <SettingsPlaceholder title={SETTINGS_SECTION_TITLES[section]} />;
}

export function SettingsView() {
  const location = useLocation();
  const navigate = useNavigate();
  const section = settingsSectionFromPath(location.pathname);
  const title = SETTINGS_SECTION_TITLES[section];
  const subtitle =
    section === 'wallet'
      ? 'Subscription, ConvoCoins balance, usage rates, and billing activity.'
      : 'Manage your workspace preferences and account configuration.';
  const [role, setRole] = useState(getUserRole());
  const [permissions, setPermissions] = useState(getUserPermissions());
  const [walletBalanceCc, setWalletBalanceCc] = useState<number | null>(null);

  useEffect(() => {
    void api.getMe().then((me) => {
      const payload = me as { role?: string; permissions?: string[] };
      if (payload.role) setRole(payload.role);
      if (payload.permissions) setPermissions(payload.permissions);
    });
  }, []);

  useEffect(() => {
    const onWalletBalance = (event: Event) => {
      const balanceCc = (event as CustomEvent<{ balanceCc: number }>).detail?.balanceCc;
      if (typeof balanceCc === 'number') setWalletBalanceCc(balanceCc);
    };

    window.addEventListener(WALLET_BALANCE_EVENT, onWalletBalance);
    void fetchWalletBalanceCc()
      .then(setWalletBalanceCc)
      .catch(() => setWalletBalanceCc(null));

    return () => window.removeEventListener(WALLET_BALANCE_EVENT, onWalletBalance);
  }, []);

  useEffect(() => {
    if (SETTINGS_HIDDEN_SECTIONS.has(section)) {
      navigate(pathForSettingsSection('wallet'), { replace: true });
    }
  }, [navigate, section]);

  const visibleNav = useMemo(
    () =>
      SETTINGS_NAV.map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (SETTINGS_HIDDEN_SECTIONS.has(item.id)) return false;
          const required = settingsSectionPermission(item.id);
          if (!required) return true;
          return hasWorkspacePermission(permissions, required, role);
        }),
      })).filter((group) => group.items.length > 0),
    [permissions, role]
  );

  const flatNavItems = useMemo(
    () => visibleNav.flatMap((group) => group.items),
    [visibleNav]
  );

  const currentSectionAllowed = useMemo(() => {
    const required = settingsSectionPermission(section);
    if (!required) return true;
    return hasWorkspacePermission(permissions, required, role);
  }, [permissions, role, section]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-2.5 md:hidden">
        <label htmlFor="settings-section-mobile" className="sr-only">
          Settings section
        </label>
        <select
          id="settings-section-mobile"
          value={section}
          onChange={(e) => navigate(pathForSettingsSection(e.target.value as SettingsSection))}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        >
          {flatNavItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[230px] shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50 md:block">
          <div className="px-3 py-3">
            <p className="px-2 pb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Workspace settings
            </p>
            {visibleNav.map((group) => (
              <div key={group.title} className="mb-4 last:mb-0">
                <p className="px-2 pb-1 text-xs font-semibold text-slate-500">{group.title}</p>
                <nav className="space-y-1">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.id}
                      to={pathForSettingsSection(item.id)}
                      className={({ isActive }) =>
                        `flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 font-semibold ring-1 ring-emerald-100'
                            : 'text-slate-600 hover:bg-white hover:text-slate-900'
                        }`
                      }
                    >
                      <span>{item.label}</span>
                      {item.id === 'wallet' && walletBalanceCc != null ? (
                        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold tabular-nums text-amber-700">
                          <ConvoCoinIcon size={12} />
                          {formatCc(walletBalanceCc, { compact: true })}
                        </span>
                      ) : null}
                    </NavLink>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex-1 min-w-0 overflow-y-auto bg-slate-50 p-3 md:p-4">
          <div className="mb-3 border border-slate-200 bg-white px-4 py-3 md:mb-4">
            <h2 className="text-base font-semibold text-slate-900 md:text-lg">{title}</h2>
            <p className="mt-0.5 text-xs text-slate-500 md:text-sm">{subtitle}</p>
          </div>

          {currentSectionAllowed ? (
            <SettingsPanel section={section} />
          ) : (
            <div className="border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-600">
                You do not have permission to view this settings section. Ask an admin to update
                your access under Users and teams.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
