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
import { AiProviderPanel } from './settings/AiProviderPanel';
import { BillingOverviewPanel } from './settings/BillingOverviewPanel';
import { InvoiceLogsPanel } from './settings/InvoiceLogsPanel';
import { SubscriptionPanel } from './settings/SubscriptionPanel';

function SettingsPanel({ section }: { section: SettingsSection }) {
  if (section === 'profile') return <ProfilePanel />;
  if (section === 'company-info') {
    return <CompanyInfoPanel key={getWorkspaceId() ?? 'company'} />;
  }
  if (section === 'users') return <UsersTeamsPanel />;
  if (section === 'ai-knowledge') return <AiKnowledgePanel />;
  if (section === 'ai-copilot') return <AiCopilotPanel />;
  if (section === 'ai-provider') return <AiProviderPanel />;
  if (section === 'subscription') return <SubscriptionPanel />;
  if (section === 'billing') return <BillingOverviewPanel />;
  if (section === 'invoices') return <InvoiceLogsPanel />;
  return <SettingsPlaceholder title={SETTINGS_SECTION_TITLES[section]} />;
}

export function SettingsView() {
  const location = useLocation();
  const navigate = useNavigate();
  const section = settingsSectionFromPath(location.pathname);
  const title = SETTINGS_SECTION_TITLES[section];
  const [role, setRole] = useState(getUserRole());
  const [permissions, setPermissions] = useState(getUserPermissions());

  useEffect(() => {
    void api.getMe().then((me) => {
      const payload = me as { role?: string; permissions?: string[] };
      if (payload.role) setRole(payload.role);
      if (payload.permissions) setPermissions(payload.permissions);
    });
  }, []);

  useEffect(() => {
    if (SETTINGS_HIDDEN_SECTIONS.has(section)) {
      navigate(pathForSettingsSection('profile'), { replace: true });
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
    <div className="flex flex-col md:flex-row gap-0 min-h-[calc(100vh-8rem)] -m-2 md:-m-4 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
      <div className="md:hidden border-b border-slate-200 bg-slate-50 p-3">
        <label htmlFor="settings-section-mobile" className="sr-only">
          Settings section
        </label>
        <select
          id="settings-section-mobile"
          value={section}
          onChange={(e) => navigate(pathForSettingsSection(e.target.value as SettingsSection))}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-800"
        >
          {flatNavItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <aside className="hidden md:block w-[220px] shrink-0 border-r border-slate-200 bg-slate-50 py-4 overflow-y-auto">
        <p className="px-4 text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
          Settings
        </p>
        {visibleNav.map((group) => (
          <div key={group.title} className="mb-4">
            <p className="px-4 text-sm font-bold text-gray-500 mb-1">{group.title}</p>
            <nav className="space-y-0.5 px-2">
              {group.items.map((item) => (
                <NavLink
                  key={item.id}
                  to={pathForSettingsSection(item.id)}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg text-xs transition-all ${
                      isActive
                        ? 'bg-white text-sky-600 font-bold shadow-sm border border-sky-100'
                        : 'text-gray-600 hover:bg-white/80 hover:text-sky-600'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </aside>

      <div className="flex-1 min-w-0 bg-slate-50 p-4 md:p-6 overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900 mb-4 md:mb-6">{title}</h2>
        {currentSectionAllowed ? (
          <SettingsPanel section={section} />
        ) : (
          <p className="text-sm text-gray-500">
            You do not have permission to view this settings section. Ask an admin to update your
            access under Users and teams.
          </p>
        )}
      </div>
    </div>
  );
}
