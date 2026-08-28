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
  Megaphone,
  FileText,
  GitBranch,
  Bot,
  Images,
  Plug,
  CalendarDays,
  Code2,
  BarChart3,
  ChevronDown,
  PanelLeft,
  PanelLeftClose,
  Settings,
  Menu,
  X,
  Ear,
  UsersRound,
  MessageSquare,
  Bell,
  Table2,
  Blocks,
} from 'lucide-react';
import { useSidebar } from '../contexts/SidebarContext';
import { api, getWorkspaceId } from '../lib/api';
import { getSocket } from '../lib/socket';
import { useWorkspaceAccess } from '../hooks/useWorkspaceAccess';
import {
  APP_REGISTRY,
  APPS_CHANGED_EVENT,
  getInstalledAppIds,
  refreshInstalledApps,
} from '../lib/installedApps';
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
import { TEAM_CHAT_UNREAD_TOTAL_EVENT } from '../lib/teamChatEvents';
import { COMPANY_UPDATED_EVENT } from '../lib/companyEvents';
import { NotificationsPanel } from './notifications/NotificationsPanel';
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
    <p className="px-3 pb-2 pt-5 font-swiss text-[11px] font-semibold uppercase tracking-[0.08em] text-swiss-muted first:pt-0">
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
  const [teamChatUnreadTotal, setTeamChatUnreadTotal] = useState(0);
  const [connectedGoogleTools, setConnectedGoogleTools] = useState<GoogleToolProduct[]>([]);
  const [googleToolsOpen, setGoogleToolsOpen] = useState(() =>
    location.pathname.startsWith('/google-tools')
  );
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifUnread, setNotifUnread] = useState(0);
  const [bellAttention, setBellAttention] = useState(false);
  const [installedAppIds, setInstalledAppIds] = useState<string[]>(() => getInstalledAppIds());
  const { collapsed, toggleCollapsed, setCollapsed, mobileOpen, setMobileOpen, toggleMobile, isLargeScreen } =
    useSidebar();
  const sidebarCollapsed = collapsed && isLargeScreen;
  const { canTab } = useWorkspaceAccess();

  const refreshNotifUnread = useCallback(async () => {
    try {
      const res = await api.getInAppNotificationUnreadCount();
      setNotifUnread(res.unread ?? 0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (notifOpen) setBellAttention(false);
  }, [notifOpen]);

  useEffect(() => {
    void refreshNotifUnread();
    const s = getSocket();
    const onNote = (payload?: { forBell?: boolean }) => {
      void refreshNotifUnread();
      if (payload?.forBell === false) return;
      if (!notifOpen) setBellAttention(true);
    };
    s.on('workspace_notification', onNote);
    return () => {
      s.off('workspace_notification', onNote);
    };
  }, [refreshNotifUnread, activeWorkspace?.id, notifOpen]);

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
    const syncFromCache = () => setInstalledAppIds(getInstalledAppIds());
    void refreshInstalledApps().then(syncFromCache).catch(() => {});
    window.addEventListener(APPS_CHANGED_EVENT, syncFromCache);
    return () => window.removeEventListener(APPS_CHANGED_EVENT, syncFromCache);
  }, [activeWorkspace?.id]);

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
    const onTeamUnread = (event: Event) => {
      const total = (event as CustomEvent<{ total: number }>).detail?.total;
      if (typeof total === 'number') setTeamChatUnreadTotal(total);
    };
    window.addEventListener(TEAM_CHAT_UNREAD_TOTAL_EVENT, onTeamUnread);
    return () => window.removeEventListener(TEAM_CHAT_UNREAD_TOTAL_EVENT, onTeamUnread);
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
          id: 'team-chat',
          label: 'Team Chat',
          icon: MessageSquare,
          badge: teamChatUnreadTotal > 0 ? teamChatUnreadTotal : undefined,
        },
        { id: 'contacts', label: 'Contacts', icon: Users },
      ],
    },
    {
      label: 'Marketing',
      items: [
        { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
        { id: 'templates', label: 'Templates', icon: FileText },
        { id: 'automations', label: 'Automations', icon: GitBranch },
        { id: 'ai-agent', label: 'AI Agent', icon: Bot },
        { id: 'social-listening', label: 'Social Listening', icon: Ear },
        { id: 'leads', label: 'Leads', icon: UsersRound },
        { id: 'data', label: 'Data', icon: Table2 },
        { id: 'media-gallery', label: 'Media Gallery', icon: Images },
      ],
    },
    ...(installedAppIds.length > 0
      ? [
          {
            label: 'Apps',
            items: APP_REGISTRY.filter((app) => installedAppIds.includes(app.id)).map((app) => ({
              id: app.tab,
              label: app.navLabel ?? app.name,
              icon: app.icon,
            })),
          },
        ]
      : []),
    {
      label: 'Systems',
      items: [
        { id: 'app-store', label: 'App Store', icon: Blocks },
        { id: 'integrations', label: 'Integrations', icon: Plug },
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
    `relative w-full flex items-center font-swiss ${
      collapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2'
    } text-[14.5px] transition-colors duration-150 ${
      active ? 'font-semibold text-swiss-ink' : 'font-normal text-swiss-muted hover:text-swiss-ink'
    }`;

  return (
    <>
      {!isLargeScreen && !mobileOpen && (
        <button
          type="button"
          onClick={toggleMobile}
          className="fixed left-3 top-3 z-40 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-black/10 bg-surface text-swiss-muted shadow-sm transition-colors hover:bg-surface-muted hover:text-primary lg:hidden"
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
        } fixed left-0 top-0 z-50 flex h-screen shrink-0 flex-col overflow-x-hidden overflow-y-auto border-r border-swiss-line bg-white transition-transform duration-200 ease-out selection:bg-swiss-accent/15 lg:static lg:z-0 lg:translate-x-0 lg:transition-[width] ${
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
              {companyLogoUrl ? (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md">
                  <img src={companyLogoUrl} alt="" className="h-full w-full object-cover" />
                </div>
              ) : null}
              {!sidebarCollapsed && (
                <h1 className="truncate font-swiss text-[15px] font-semibold tracking-tight text-swiss-ink">
                  {displayCompanyName}
                </h1>
              )}
              {sidebarCollapsed && !companyLogoUrl && (
                <span className="font-swiss text-[13px] font-semibold text-swiss-ink">
                  {displayCompanyInitial}
                </span>
              )}
            </NavLink>
            <button
              type="button"
              onClick={toggleCollapsed}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden rounded-md p-1.5 text-swiss-faint transition-colors hover:text-swiss-ink lg:inline-flex"
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
                className="inline-flex rounded-md p-1.5 text-swiss-faint transition-colors hover:text-swiss-ink lg:hidden"
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
                  const isContacts = item.id === 'contacts';
                  const isLeads = item.id === 'leads';
                  const isAutomations = item.id === 'automations';
                  const isSettings = item.id === 'settings';
                  const isSocialListening = item.id === 'social-listening';
                  const itemPath = item.path ?? pathForTab(item.id);
                  const onSettingsPage = location.pathname.startsWith('/settings');
                  const onAutomationsPage = location.pathname.startsWith('/automations');

                  const isIntegrations = item.id === 'integrations';
                  const isItemActive = (isActive: boolean) => {
                    if (isSettings) return onSettingsPage;
                    if (isAutomations) return onAutomationsPage;
                    return (
                      isActive ||
                      (isCampaigns && location.pathname.startsWith('/campaigns/')) ||
                      (isContacts && location.pathname.startsWith('/contacts/')) ||
                      (isLeads && location.pathname.startsWith('/leads/')) ||
                      (isSocialListening &&
                        location.pathname.startsWith('/social-listening')) ||
                      (isIntegrations && location.pathname.startsWith('/integrations'))
                    );
                  };

                  return (
                    <NavLink
                      key={item.id}
                      to={itemPath}
                      title={sidebarCollapsed ? item.label : undefined}
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
                                  active ? 'text-swiss-ink' : 'text-swiss-faint'
                                }`}
                                strokeWidth={1.75}
                              />
                              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                              {item.pulse ? (
                                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-white bg-red-500 animate-pulse" />
                              ) : null}
                              {sidebarCollapsed && item.badge ? (
                                <span className="absolute -right-2 -top-1.5 font-swiss text-[10px] font-semibold text-swiss-accent">
                                  {item.badge > 99 ? '99+' : item.badge}
                                </span>
                              ) : null}
                            </div>
                            {!sidebarCollapsed && item.badge ? (
                              <span className="font-swiss text-[12px] font-semibold text-swiss-accent">
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
                      isGoogleToolsRoute ? 'text-swiss-ink' : 'text-swiss-faint'
                    }`}
                    strokeWidth={1.75}
                  />
                  {!sidebarCollapsed && <span>Google Tools</span>}
                </div>
                {!sidebarCollapsed && (
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-swiss-faint transition-transform ${
                      googleToolsOpen ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>

              {googleToolsOpen && !sidebarCollapsed && (
                <div className="ml-2 mt-0.5 space-y-0.5 border-l border-swiss-line pl-2">
                  {connectedMainGoogleTools.map((tool) => {
                    const meta = GOOGLE_TOOL_META[tool];
                    const ToolIcon = meta.icon;
                    const toolPath = pathForGoogleTool(tool);
                    const isActive = location.pathname === toolPath;
                    return (
                      <NavLink
                        key={tool}
                        to={toolPath}
                        className={`font-swiss flex w-full items-center gap-2 px-2.5 py-1.5 text-[14.5px] transition-colors ${
                          isActive ? 'font-semibold text-swiss-ink' : 'text-swiss-muted hover:text-swiss-ink'
                        }`}
                      >
                        <ToolIcon
                          className={`h-4 w-4 shrink-0 ${isActive ? 'text-swiss-ink' : 'text-swiss-faint'}`}
                          strokeWidth={1.75}
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
                            isActive ? 'text-swiss-ink' : 'text-swiss-faint'
                          }`}
                          strokeWidth={1.75}
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

        <div
          className={`mt-auto space-y-0.5 border-t border-swiss-line ${
            sidebarCollapsed ? 'p-2' : 'px-2 py-2'
          }`}
        >
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            title={sidebarCollapsed ? 'Notifications' : undefined}
            className={navLinkClass(notifOpen, sidebarCollapsed)}
            aria-label="Notifications"
            aria-expanded={notifOpen}
          >
            <div className="relative shrink-0">
              <Bell
                className={`h-4 w-4 ${notifOpen ? 'text-swiss-ink' : 'text-swiss-faint'}${
                  bellAttention && !notifOpen ? ' notif-bell-attention' : ''
                }`}
                strokeWidth={1.75}
              />
              {notifUnread > 0 && (
                <span
                  className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-white bg-red-500${
                    bellAttention && !notifOpen ? ' animate-pulse' : ''
                  }`}
                />
              )}
            </div>
            {!sidebarCollapsed && <span>Notifications</span>}
          </button>
        </div>
      </aside>

      <NotificationsPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        onUnreadChange={setNotifUnread}
      />
    </>
  );
};
