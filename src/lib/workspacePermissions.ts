import { tabAllowedByPlan, channelAllowedByPlan, type PlanFeatureFlags } from './planEntitlements';

export const WORKSPACE_PERMISSION_DEFS = [
  { key: 'inbox', label: 'Inbox & conversations' },
  { key: 'contacts', label: 'Contacts & CRM' },
  { key: 'campaigns', label: 'Campaigns & journeys' },
  { key: 'ai', label: 'AI & automation' },
  { key: 'analytics', label: 'Analytics & reports' },
  { key: 'settings', label: 'Workspace settings' },
  { key: 'billing', label: 'Billing & subscription' },
  { key: 'users', label: 'Users & teams' },
  { key: 'integrations', label: 'Channels & integrations' },
] as const;

export type WorkspacePermission = (typeof WORKSPACE_PERMISSION_DEFS)[number]['key'];

export const DEFAULT_AGENT_PERMISSIONS: WorkspacePermission[] = ['inbox', 'contacts'];

export function hasWorkspacePermission(
  permissions: string[] | null | undefined,
  required: WorkspacePermission,
  role?: string | null
): boolean {
  if (role === 'admin') return true;
  const list = permissions?.length ? permissions : DEFAULT_AGENT_PERMISSIONS;
  return list.includes(required);
}

export function settingsSectionPermission(section: string): WorkspacePermission | null {
  if (section === 'profile') return null;
  if (section === 'users') return 'users';
  if (['wallet', 'usage', 'subscription', 'billing', 'recharge', 'invoices'].includes(section))
    return 'billing';
  if (section.startsWith('contact-')) return 'contacts';
  if (['inbox-tags', 'canned-response', 'calling-tags'].includes(section)) return 'inbox';
  if (['ai-copilot', 'ai-knowledge', 'ai-provider', 'web-widget'].includes(section)) return 'ai';
  return 'settings';
}

/** Maps main sidebar tab ids to required permission (null = always visible). */
export function tabPermission(tab: string): WorkspacePermission | null {
  switch (tab) {
    case 'dashboard':
      return 'analytics';
    case 'manager':
    case 'facebook':
    case 'pay':
    case 'shop':
    case 'integrations':
    case 'google-tools':
    case 'developers':
      return 'integrations';
    case 'inbox':
    case 'calling':
      return 'inbox';
    case 'contacts':
      return 'contacts';
    case 'campaigns':
    case 'templates':
    case 'automations':
    case 'journey':
    case 'instagram-automation':
    case 'ctwa':
      return 'campaigns';
    case 'social-listening':
    case 'leads':
    case 'app-store':
    case 'crm':
    case 'attendance':
    case 'dasalon-console':
    case 'dasalon-partner':
      // ponytail: UI mock pages — no backend permission yet; gate later when APIs land
      return null;
    case 'data':
      return 'campaigns';
    case 'ai-agent':
    case 'media-gallery':
      return 'ai';
    case 'reports':
      return 'analytics';
    case 'usage-cost':
    case 'wallet':
      return 'billing';
    case 'settings':
      return null;
    default:
      return null;
  }
}

export function canAccessTab(
  tab: string,
  permissions: string[] | null | undefined,
  role?: string | null,
  plan?: PlanFeatureFlags | null
): boolean {
  if (!tabAllowedByPlan(tab, plan)) return false;
  const required = tabPermission(tab);
  if (!required) return true;
  return hasWorkspacePermission(permissions, required, role);
}

export function canAccessPath(
  pathname: string,
  permissions: string[] | null | undefined,
  role?: string | null,
  plan?: PlanFeatureFlags | null
): boolean {
  const clean = pathname.replace(/\/$/, '') || '/';
  if (clean.startsWith('/settings')) {
    const section = clean.split('/')[2] ?? 'profile';
    const required = settingsSectionPermission(section);
    if (!required) return true;
    return hasWorkspacePermission(permissions, required, role);
  }
  if (clean.startsWith('/campaigns')) return canAccessTab('campaigns', permissions, role, plan);
  if (clean.startsWith('/automations/instagram-automation')) {
    if (!channelAllowedByPlan(plan, 'instagram')) return false;
    return canAccessTab('automations', permissions, role, plan);
  }
  if (clean.startsWith('/automations')) return canAccessTab('automations', permissions, role, plan);
  if (clean.startsWith('/instagram-automation')) {
    if (!channelAllowedByPlan(plan, 'instagram')) return false;
    return canAccessTab('automations', permissions, role, plan);
  }
  if (clean.startsWith('/journey')) {
    return canAccessTab('automations', permissions, role, plan);
  }
  if (clean.startsWith('/templates')) return canAccessTab('templates', permissions, role, plan);
  if (clean.startsWith('/ai-agent')) return canAccessTab('ai-agent', permissions, role, plan);
  if (clean.startsWith('/media-gallery')) return canAccessTab('media-gallery', permissions, role, plan);
  if (clean.startsWith('/social-listening')) return canAccessTab('social-listening', permissions, role, plan);
  if (clean.startsWith('/leads')) return canAccessTab('leads', permissions, role, plan);
  if (clean.startsWith('/google-tools')) return canAccessTab('google-tools', permissions, role, plan);
  const segment = clean.replace(/^\//, '').split('/')[0] || 'dashboard';
  return canAccessTab(segment, permissions, role, plan);
}

const NAV_TAB_ORDER = [
  'inbox',
  'dashboard',
  'contacts',
  'calling',
  'campaigns',
  'templates',
  'automations',
  'ai-agent',
  'media-gallery',
  'social-listening',
  'leads',
  'data',
  'manager',
  'ctwa',
  'facebook',
  'pay',
  'shop',
  'integrations',
  'google-tools',
  'developers',
  'reports',
  'usage-cost',
  'settings',
] as const;

export function pathForAppTab(tab: string): string {
  if (tab === 'settings') return '/settings/profile';
  return `/${tab}`;
}

export function firstAccessibleTabPath(
  permissions: string[] | null | undefined,
  role?: string | null,
  plan?: PlanFeatureFlags | null
): string {
  for (const tab of NAV_TAB_ORDER) {
    if (canAccessTab(tab, permissions, role, plan)) {
      return pathForAppTab(tab);
    }
  }
  return '/settings/profile';
}

const SETTINGS_SECTION_ORDER = [
  'profile',
  'company-info',
  'users',
  'automation',
  'alerts',
  // 'security',
  // 'holidays',
  'wallet',
  'invoices',
  // 'contact-attributes',
  // 'contact-tags',
  // 'contact-events',
  // 'inbox-tags',
  // 'canned-response',
  // 'ai-copilot',
  // 'ai-knowledge',
  // 'calling-tags',
] as const;

export function firstAccessibleSettingsPath(
  permissions: string[] | null | undefined,
  role?: string | null
): string {
  for (const section of SETTINGS_SECTION_ORDER) {
    const required = settingsSectionPermission(section);
    if (!required || hasWorkspacePermission(permissions, required, role)) {
      return `/settings/${section}`;
    }
  }
  return '/settings/profile';
}
