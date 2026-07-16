/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { pathForGoogleTool, pathForSettingsSection, pathForTab } from '../routes';
import {
  LayoutGrid,
  Inbox,
  Users,
  Bell,
  Megaphone,
  FileText,
  GitBranch,
  Bot,
  Plug,
  CalendarDays,
  Code2,
  BarChart3,
  Receipt,
  Wallet,
  ChevronDown,
  PanelLeft,
  PanelLeftClose,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { useSidebar } from '../contexts/SidebarContext';
import { api, getWorkspaceId } from '../lib/api';
import { useWorkspaceAccess } from '../hooks/useWorkspaceAccess';
import {
  GOOGLE_TOOL_META,
  GOOGLE_TOOLS_CHANGED_EVENT,
  GOOGLE_TOOLS_MAIN_TABS,
  isGoogleToolProduct,
  type GoogleToolProduct,
  type GoogleToolsMainTab,
} from '../lib/googleTools';
import {
  fetchInboxUnreadTotal,
  INBOX_UNREAD_TOTAL_EVENT,
} from '../lib/inboxEvents';
import { fetchWalletBalanceCc, WALLET_BALANCE_EVENT } from '../lib/walletEvents';
import { COMPANY_UPDATED_EVENT } from '../lib/companyEvents';
import { formatCc } from '../lib/convocoins';
import { ConvoCoinIcon } from './ConvoCoinIcon';
import type { WorkspaceSummary } from './WorkspaceSwitcherDialog';

const SIDEBAR_HIDDEN_TABS = new Set([
  'developers',
  'reports',
  'facebook',
  'calling',
  'shop',
  'manager',
  'google-tools',
  'ctwa',
  'pay',
  'notifications',
]);

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  path?: string;
  pulse?: boolean;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) return null;
  return (
    <p className="px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wide text-slate-400">
      {label}
    </p>
  );
}

export const SideNavBar: React.FC = () => {
  const location = useLocation();
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceSummary | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [inboxUnreadTotal, setInboxUnreadTotal] = useState(0);
  const [walletBalanceCc, setWalletBalanceCc] = useState<number | null>(null);
  const [connectedGoogleTools, setConnectedGoogleTools] = useState<GoogleToolProduct[]>([]);
  const [googleToolsOpen, setGoogleToolsOpen] = useState(() =>
    location.pathname.startsWith('/google-tools')
  );
  const { collapsed, toggleCollapsed, setCollapsed, mobileOpen, setMobileOpen, toggleMobile, isLargeScreen } =
    useSidebar();
  const sidebarCollapsed = collapsed && isLargeScreen;
  const { canTab } = useWorkspaceAccess();

  useEffect(() => {
    const wsId = getWorkspaceId();
    api
      .getWorkspaces()
      .then((res) => {
        const list: WorkspaceSummary[] = res.workspaces ?? [];
        const active =
          list.find((w) => w.id === (res.activeWorkspaceId ?? wsId)) ?? list[0] ?? null;
        setActiveWorkspace(active);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    void api
      .getCompanySettings()
      .then((res) => {
        const data = res as { name?: string | null; logoUrl?: string | null };
        setCompanyName(data.name?.trim() || null);
        setCompanyLogoUrl(data.logoUrl?.trim() || null);
      })
      .catch(() => {
        setCompanyName(null);
        setCompanyLogoUrl(null);
      });
  }, [activeWorkspace?.id]);

  useEffect(() => {
    const onCompanyUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ name?: string | null; logoUrl?: string | null }>).detail;
      if (detail?.name !== undefined) {
        setCompanyName(detail.name?.trim() || null);
      }
      if (detail?.logoUrl !== undefined) {
        setCompanyLogoUrl(detail.logoUrl?.trim() || null);
      }
    };

    window.addEventListener(COMPANY_UPDATED_EVENT, onCompanyUpdated);
    return () => window.removeEventListener(COMPANY_UPDATED_EVENT, onCompanyUpdated);
  }, []);

  const loadConnectedGoogleTools = useCallback(() => {
    api
      .getGoogleProducts()
      .then((res) => {
        const connected = (res.products ?? [])
          .filter((p) => p.status === 'connected' && isGoogleToolProduct(p.product))
          .map((p) => p.product as GoogleToolProduct);
        setConnectedGoogleTools(connected);
      })
      .catch(() => setConnectedGoogleTools([]));
  }, []);

  useEffect(() => {
    loadConnectedGoogleTools();
    const onGoogleToolsChanged = () => loadConnectedGoogleTools();
    window.addEventListener(GOOGLE_TOOLS_CHANGED_EVENT, onGoogleToolsChanged);
    return () => window.removeEventListener(GOOGLE_TOOLS_CHANGED_EVENT, onGoogleToolsChanged);
  }, [loadConnectedGoogleTools, activeWorkspace?.id]);

  useEffect(() => {
    if (location.pathname.startsWith('/google-tools')) {
      setGoogleToolsOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, setMobileOpen]);

  useEffect(() => {
    const onUnreadTotal = (event: Event) => {
      const total = (event as CustomEvent<{ total: number }>).detail?.total;
      if (typeof total === 'number') setInboxUnreadTotal(total);
    };

    window.addEventListener(INBOX_UNREAD_TOTAL_EVENT, onUnreadTotal);
    void fetchInboxUnreadTotal()
      .then(setInboxUnreadTotal)
      .catch(() => {});

    return () => window.removeEventListener(INBOX_UNREAD_TOTAL_EVENT, onUnreadTotal);
  }, [activeWorkspace?.id]);

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
  }, [activeWorkspace?.id]);

  const displayName = activeWorkspace?.name ?? 'ConvoSync';
  const displayCompanyName = companyName || displayName;
  const displayCompanyInitial = displayCompanyName.charAt(0).toUpperCase();

  const navSections: NavSection[] = [
    {
      label: 'General',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
        {
          id: 'inbox',
          label: 'Inbox',
          icon: Inbox,
          badge: inboxUnreadTotal > 0 ? inboxUnreadTotal : undefined,
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
          path: pathForSettingsSection('notifications'),
          pulse: true,
        },
        { id: 'contacts', label: 'Contacts', icon: Users },
      ],
    },
    {
      label: 'Marketing',
      items: [
        { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
        { id: 'templates', label: 'Templates', icon: FileText },
        { id: 'journey', label: 'Journeys', icon: GitBranch },
        { id: 'ai-agent', label: 'AI Agent', icon: Bot },
      ],
    },
    {
      label: 'Systems',
      items: [
        { id: 'integrations', label: 'Integrations', icon: Plug },
        { id: 'wallet', label: 'Wallet', icon: Wallet, path: pathForSettingsSection('wallet') },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const secondaryHiddenItems = [
    { id: 'developers', label: 'Developers', icon: Code2 },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const connectedMainGoogleTools = GOOGLE_TOOLS_MAIN_TABS.filter((tool) =>
    connectedGoogleTools.includes(tool)
  ) as GoogleToolsMainTab[];

  const isGoogleToolsRoute = location.pathname.startsWith('/google-tools');

  const visibleNavSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !SIDEBAR_HIDDEN_TABS.has(item.id) && canTab(item.id)
      ),
    }))
    .filter((section) => section.items.length > 0);

  const visibleSecondaryItems = secondaryHiddenItems.filter(
    (item) => !SIDEBAR_HIDDEN_TABS.has(item.id) && canTab(item.id)
  );

  const showGoogleTools =
    !SIDEBAR_HIDDEN_TABS.has('google-tools') &&
    connectedMainGoogleTools.length > 0 &&
    canTab('google-tools');

  const navLinkClass = (active: boolean, collapsed: boolean) =>
    `w-full flex items-center ${
      collapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2'
    } rounded-lg text-sm transition-colors duration-200 ${
      active
        ? `bg-emerald-50 font-semibold text-emerald-800 ${collapsed ? 'ring-1 ring-emerald-100' : ''}`
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`;

  return (
    <>
      {!isLargeScreen && !mobileOpen && (
        <button
          type="button"
          onClick={toggleMobile}
          className="fixed left-3 top-3 z-40 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-emerald-700 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {!isLargeScreen && mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`${
          sidebarCollapsed && isLargeScreen ? 'w-[72px]' : 'w-[min(260px,85vw)] lg:w-[220px]'
        } fixed left-0 top-0 z-50 flex h-screen flex-col overflow-x-hidden overflow-y-auto border-r border-gray-200/80 bg-white/95 backdrop-blur-sm transition-transform duration-200 ease-out selection:bg-emerald-100 lg:transition-[width] ${
          isLargeScreen || mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className={`${sidebarCollapsed ? 'p-2' : 'px-3 py-3'}`}>
          <div
            className={`flex items-center ${sidebarCollapsed ? 'flex-col gap-2' : 'justify-between gap-2'}`}
          >
            <NavLink
              to={pathForSettingsSection('company-info')}
              title={sidebarCollapsed ? displayCompanyName : undefined}
              className={`flex min-w-0 items-center gap-2 ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-100 text-emerald-800">
                {companyLogoUrl ? (
                  <img src={companyLogoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-semibold">{displayCompanyInitial}</span>
                )}
              </div>
              {!sidebarCollapsed && (
                <h1 className="truncate font-sans text-base font-semibold tracking-tight text-slate-900">
                  {displayCompanyName}
                </h1>
              )}
            </NavLink>
            <button
              type="button"
              onClick={toggleCollapsed}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:inline-flex"
            >
              {sidebarCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
            {!isLargeScreen && (
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:hidden"
                aria-label="Close navigation menu"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <nav className="flex-1 px-2 pb-2">
          {visibleNavSections.map((section) => (
            <div key={section.label}>
              <SectionLabel label={section.label} collapsed={sidebarCollapsed} />
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isCampaigns = item.id === 'campaigns';
                  const isSettings = item.id === 'settings';
                  const isWallet = item.id === 'wallet';
                  const isNotifications = item.id === 'notifications';
                  const itemPath = item.path ?? pathForTab(item.id);
                  const onNotificationsPage = location.pathname.startsWith(
                    '/settings/notifications'
                  );
                  const onWalletPage = location.pathname.startsWith('/settings/wallet');
                  const onSettingsPage =
                    location.pathname.startsWith('/settings') &&
                    !onNotificationsPage &&
                    !onWalletPage;

                  const isItemActive = (isActive: boolean) => {
                    if (isNotifications) return onNotificationsPage;
                    if (isWallet) return onWalletPage;
                    if (isSettings) return onSettingsPage;
                    return (
                      isActive ||
                      (isCampaigns && location.pathname.startsWith('/campaigns/'))
                    );
                  };

                  return (
                    <NavLink
                      key={item.id}
                      to={itemPath}
                      title={
                        sidebarCollapsed
                          ? isWallet && walletBalanceCc != null
                            ? `${item.label} · ${formatCc(walletBalanceCc, { compact: true })}`
                            : item.label
                          : undefined
                      }
                      className={({ isActive }) =>
                        navLinkClass(isItemActive(isActive), sidebarCollapsed)
                      }
                    >
                      {({ isActive }) => {
                        const active = isItemActive(isActive);
                        return (
                          <>
                            <div
                              className={`relative flex min-w-0 flex-1 items-center ${
                                sidebarCollapsed ? '' : 'gap-2'
                              }`}
                            >
                              <Icon
                                className={`h-4 w-4 shrink-0 ${
                                  active ? 'text-emerald-700' : 'text-slate-400'
                                }`}
                              />
                              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                              {item.pulse ? (
                                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-white bg-red-500 animate-pulse" />
                              ) : null}
                              {sidebarCollapsed && item.badge ? (
                                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-channel-green px-1 text-[10px] font-bold text-white">
                                  {item.badge > 99 ? '99+' : item.badge}
                                </span>
                              ) : null}
                              {sidebarCollapsed && isWallet && walletBalanceCc != null ? (
                                <span className="absolute -right-1 -top-1 inline-flex max-w-[2.75rem] items-center gap-0.5 truncate rounded-full bg-amber-50 py-0.5 pl-0.5 pr-1 text-[9px] font-bold tabular-nums text-amber-800 ring-1 ring-amber-200">
                                  <ConvoCoinIcon size={10} />
                                  {walletBalanceCc > 999 ? '999+' : walletBalanceCc}
                                </span>
                              ) : null}
                            </div>
                            {!sidebarCollapsed && isWallet && walletBalanceCc != null ? (
                              <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold tabular-nums text-amber-700">
                                <ConvoCoinIcon size={12} />
                                {formatCc(walletBalanceCc, { compact: true })}
                              </span>
                            ) : null}
                            {!sidebarCollapsed && item.badge ? (
                              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-channel-green px-1.5 text-xs font-bold text-white">
                                {item.badge > 99 ? '99+' : item.badge}
                              </span>
                            ) : null}
                          </>
                        );
                      }}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}

          {showGoogleTools && (
            <div className="pt-0.5">
              <button
                type="button"
                title={sidebarCollapsed ? 'Google Tools' : undefined}
                onClick={() => {
                  if (sidebarCollapsed) {
                    setCollapsed(false);
                    setGoogleToolsOpen(true);
                    return;
                  }
                  setGoogleToolsOpen((open) => !open);
                }}
                className={navLinkClass(isGoogleToolsRoute, sidebarCollapsed)}
              >
                <div className={`flex items-center ${sidebarCollapsed ? '' : 'gap-2'}`}>
                  <CalendarDays
                    className={`h-4 w-4 shrink-0 ${
                      isGoogleToolsRoute ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  />
                  {!sidebarCollapsed && <span>Google Tools</span>}
                </div>
                {!sidebarCollapsed && (
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${
                      googleToolsOpen ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>

              {googleToolsOpen && !sidebarCollapsed && (
                <div className="ml-2 mt-0.5 space-y-0.5 border-l border-slate-200 pl-2">
                  {connectedMainGoogleTools.map((tool) => {
                    const meta = GOOGLE_TOOL_META[tool];
                    const ToolIcon = meta.icon;
                    const toolPath = pathForGoogleTool(tool);
                    const isActive = location.pathname === toolPath;
                    return (
                      <NavLink
                        key={tool}
                        to={toolPath}
                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                          isActive
                            ? 'bg-emerald-50 font-semibold text-emerald-800'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <ToolIcon
                          className={`h-4 w-4 shrink-0 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`}
                        />
                        <span>{meta.shortLabel}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {visibleSecondaryItems.length > 0 && (
            <div className="space-y-0.5 pt-1">
              {visibleSecondaryItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.id}
                    to={pathForTab(item.id)}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={({ isActive }) => navLinkClass(isActive, sidebarCollapsed)}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            isActive ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        />
                        {!sidebarCollapsed && <span>{item.label}</span>}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          )}
        </nav>
      </aside>
    </>
  );
};
