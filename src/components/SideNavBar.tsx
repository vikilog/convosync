/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { pathForGoogleTool, pathForTab } from '../routes';
import {
  LayoutGrid,
  Inbox,
  Users,
  Megaphone,
  FileText,
  GitBranch,
  Bot,
  Plug,
  CalendarDays,
  Code2,
  BarChart3,
  Receipt,
  ChevronDown,
  PanelLeft,
  PanelLeftClose,
  Settings,
  LogOut,
} from 'lucide-react';
import { PRODUCT_LOGO, PRODUCT_NAME } from '../lib/brand';
import { useSidebar } from '../contexts/SidebarContext';
import { api, getWorkspaceId, getUserName, getUserAvatar } from '../lib/api';
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
import { pathForSettingsSection } from '../routes';
import { clearAuthSession } from '../lib/session';
import { disconnectSocket } from '../lib/socket';
import {
  WorkspaceSwitcherDialog,
  type WorkspaceSummary,
} from './WorkspaceSwitcherDialog';

interface SideNavBarProps {
  workspaceName?: string;
}

const SIDEBAR_HIDDEN_TABS = new Set([
  'developers',
  'reports',
  'pay',
  'facebook',
  'ctwa',
  'calling',
  'shop',
  'manager',
  'google-tools',
]);

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
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

export const SideNavBar: React.FC<SideNavBarProps> = ({
  workspaceName = 'ConvoSync',
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceSummary | null>(null);
  const [inboxUnreadTotal, setInboxUnreadTotal] = useState(0);
  const [connectedGoogleTools, setConnectedGoogleTools] = useState<GoogleToolProduct[]>([]);
  const [googleToolsOpen, setGoogleToolsOpen] = useState(() =>
    location.pathname.startsWith('/google-tools')
  );
  const [, setProfileTick] = useState(0);
  const { collapsed, toggleCollapsed, setCollapsed, mobileOpen, setMobileOpen, isLargeScreen } =
    useSidebar();
  const sidebarCollapsed = collapsed && isLargeScreen;
  const { role: displayUserRole, canTab } = useWorkspaceAccess();
  const displayUserName = getUserName() || 'Vikas Swami';
  const displayUserAvatar = getUserAvatar() || '';

  useEffect(() => {
    const onProfileUpdated = () => setProfileTick((n) => n + 1);
    window.addEventListener('convosync:profile-updated', onProfileUpdated);
    return () => window.removeEventListener('convosync:profile-updated', onProfileUpdated);
  }, []);

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

  const displayName = activeWorkspace?.name ?? 'ConvoSync';
  const displayInitial = displayName.charAt(0).toUpperCase();

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
        { id: 'usage-cost', label: 'Usage & Cost', icon: Receipt },
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
        ? `bg-sky-50 font-semibold text-sky-700 ${collapsed ? 'ring-1 ring-sky-100' : ''}`
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`;

  return (
    <>
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
        } fixed left-0 top-0 z-50 flex h-screen flex-col overflow-x-hidden overflow-y-auto border-r border-slate-200 bg-white transition-transform duration-200 ease-out selection:bg-sky-100 lg:transition-[width] ${
          isLargeScreen || mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className={`${sidebarCollapsed ? 'p-2' : 'px-3 py-3'}`}>
          <div
            className={`flex items-center ${sidebarCollapsed ? 'flex-col gap-2' : 'justify-between gap-2'}`}
          >
            <div className={`flex items-center gap-2 ${sidebarCollapsed ? 'justify-center' : 'min-w-0'}`}>
              <img
                src={PRODUCT_LOGO}
                alt={PRODUCT_NAME}
                className={`shrink-0 object-contain ${sidebarCollapsed ? 'h-9 w-9' : 'h-9 w-9'}`}
              />
              {!sidebarCollapsed && (
                <h1 className="truncate font-sans text-base font-semibold tracking-tight text-slate-900">
                  {workspaceName}
                </h1>
              )}
            </div>
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
          </div>

          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            title={sidebarCollapsed ? `Workspace: ${displayName}` : undefined}
            className={`${
              sidebarCollapsed ? 'mt-2 mx-auto p-0 border-0 bg-transparent' : 'mt-3 w-full'
            } flex cursor-pointer items-center ${
              sidebarCollapsed ? 'justify-center' : 'justify-between gap-2'
            } rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition-colors hover:border-sky-200 hover:bg-white`}
          >
            <div className={`flex items-center ${sidebarCollapsed ? '' : 'min-w-0 gap-2'}`}>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                {displayInitial}
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0 overflow-hidden">
                  <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            )}
          </button>
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

                  return (
                    <NavLink
                      key={item.id}
                      to={pathForTab(item.id)}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={({ isActive }) => {
                        const active =
                          isActive ||
                          (isCampaigns && location.pathname.startsWith('/campaigns/')) ||
                          (isSettings && location.pathname.startsWith('/settings'));
                        return navLinkClass(active, sidebarCollapsed);
                      }}
                    >
                      {({ isActive }) => {
                        const active =
                          isActive ||
                          (isCampaigns && location.pathname.startsWith('/campaigns/')) ||
                          (isSettings && location.pathname.startsWith('/settings'));
                        return (
                          <>
                            <div
                              className={`relative flex items-center ${sidebarCollapsed ? '' : 'gap-2'}`}
                            >
                              <Icon
                                className={`h-4 w-4 shrink-0 ${
                                  active ? 'text-sky-600' : 'text-slate-400'
                                }`}
                              />
                              {!sidebarCollapsed && <span>{item.label}</span>}
                              {sidebarCollapsed && item.badge ? (
                                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-sky-600 px-1 text-[10px] font-bold text-white">
                                  {item.badge > 99 ? '99+' : item.badge}
                                </span>
                              ) : null}
                            </div>
                            {!sidebarCollapsed && item.badge ? (
                              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-sky-600 px-1.5 text-xs font-bold text-white">
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
                      isGoogleToolsRoute ? 'text-sky-600' : 'text-slate-400'
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
                            ? 'bg-sky-50 font-semibold text-sky-700'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <ToolIcon
                          className={`h-4 w-4 shrink-0 ${isActive ? 'text-sky-600' : 'text-slate-400'}`}
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
                            isActive ? 'text-sky-600' : 'text-slate-400'
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

        <div className="mt-auto border-t border-slate-200 px-2 py-3">
          <div
            className={`flex items-center ${
              sidebarCollapsed ? 'justify-center p-2' : 'gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5'
            }`}
          >
            {displayUserAvatar ? (
              <img
                src={displayUserAvatar}
                alt={displayUserName}
                className="h-8 w-8 shrink-0 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
                {displayUserName.charAt(0).toUpperCase()}
              </div>
            )}
            {!sidebarCollapsed && (
              <>
                <div className="min-w-0 flex-1 overflow-hidden text-left">
                  <span className="block truncate text-sm font-semibold text-slate-900">
                    {displayUserName}
                  </span>
                  <span className="mt-0.5 block text-xs capitalize text-slate-500">
                    {displayUserRole || 'Admin'}
                  </span>
                </div>
                <NavLink
                  to={pathForSettingsSection('profile')}
                  className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-sky-600"
                  aria-label="Profile settings"
                >
                  <Settings className="h-4 w-4" />
                </NavLink>
              </>
            )}
          </div>

          <button
            type="button"
            title={sidebarCollapsed ? 'Log out' : undefined}
            onClick={() => {
              disconnectSocket();
              clearAuthSession();
              navigate('/login', { replace: true });
            }}
            className={`mt-1 flex w-full cursor-pointer items-center ${
              sidebarCollapsed ? 'justify-center px-2 py-2' : 'gap-2 px-3 py-2'
            } rounded-lg text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && 'Log out'}
          </button>
        </div>
      </aside>

      <WorkspaceSwitcherDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        activeWorkspaceId={activeWorkspace?.id ?? getWorkspaceId()}
        onActiveChange={setActiveWorkspace}
      />
    </>
  );
};
