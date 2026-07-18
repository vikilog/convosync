export const VALID_TABS = [
  'dashboard',
  'manager',
  'inbox',
  'contacts',
  'calling',
  'campaigns',
  'templates',
  'journey',
  'ai-agent',
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

export type AppTab = (typeof VALID_TABS)[number];

export const SETTINGS_SECTIONS = [
  'profile',
  'company-info',
  'users',
  'security',
  'holidays',
  'notifications',
  'wallet',
  'subscription',
  'billing',
  'recharge',
  'invoices',
  'contact-attributes',
  'contact-tags',
  'contact-events',
  'inbox-tags',
  'canned-response',
  'ai-copilot',
  'ai-knowledge',
  'ai-provider',
  'calling-tags',
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

export function tabFromPath(pathname: string): AppTab {
  const segment = pathname.replace(/^\//, '').split('/')[0];
  if (!segment || segment === '') return 'dashboard';
  if (segment === 'settings') return 'settings';
  if (segment === 'google-tools') return 'google-tools';
  if (VALID_TABS.includes(segment as AppTab)) return segment as AppTab;
  return 'dashboard';
}

export function googleToolFromPath(pathname: string): string | null {
  const parts = pathname.replace(/^\//, '').split('/').filter(Boolean);
  if (parts[0] !== 'google-tools' || !parts[1]) return null;
  return parts[1];
}

export function pathForGoogleTool(product: string): string {
  return `/google-tools/${product}`;
}

export function settingsSectionFromPath(pathname: string): SettingsSection {
  const parts = pathname.replace(/\/$/, '').split('/').filter(Boolean);
  if (parts[0] !== 'settings') return 'profile';
  const segment = parts[1];
  if (segment === 'subscription' || segment === 'billing' || segment === 'recharge') {
    return 'wallet';
  }
  if (segment && SETTINGS_SECTIONS.includes(segment as SettingsSection)) {
    return segment as SettingsSection;
  }
  return 'company-info';
}

export function pathForTab(tab: string): string {
  if (tab === 'settings') return '/settings/company-info';
  return `/${tab}`;
}

export type IntegrationsChannel =
  | 'whatsapp'
  | 'whatsapp-coexistence'
  | 'email'
  | 'instagram'
  | 'google'
  | 'meta-ads'
  | 'google-ads';

export function pathForIntegrationsChannel(channel: IntegrationsChannel): string {
  return `/integrations?channel=${channel}`;
}

export type AgentEditorSection = 'profile' | 'skills' | 'knowledge' | 'flows';

export function agentIdFromPath(pathname: string): string | null {
  const parts = pathname.replace(/^\//, '').split('/').filter(Boolean);
  if (parts[0] !== 'ai-agent' || !parts[1]) return null;
  return parts[1];
}

export function agentSectionFromPath(pathname: string): AgentEditorSection {
  const parts = pathname.replace(/^\//, '').split('/').filter(Boolean);
  const section = parts[2];
  if (section === 'skills' || section === 'knowledge' || section === 'flows') return section;
  return 'profile';
}

export function agentSkillIdFromPath(pathname: string): string | null {
  const parts = pathname.replace(/^\//, '').split('/').filter(Boolean);
  if (parts[0] !== 'ai-agent' || parts[2] !== 'skills' || !parts[3]) return null;
  return parts[3];
}

export function pathForAgent(agentId: string, section: AgentEditorSection = 'profile'): string {
  return `/ai-agent/${agentId}/${section}`;
}

export function pathForAgentSkill(agentId: string, skillId: string): string {
  return `/ai-agent/${agentId}/skills/${skillId}`;
}

export function campaignIdFromPath(pathname: string): string | null {
  const parts = pathname.replace(/^\//, '').split('/').filter(Boolean);
  if (parts[0] !== 'campaigns' || !parts[1] || parts[1] === 'new') return null;
  return parts[1];
}

export function pathForCampaign(campaignId: string): string {
  return `/campaigns/${campaignId}`;
}

export function pathForNewCampaign(): string {
  return '/campaigns/new';
}

export function isNewCampaignPath(pathname: string): boolean {
  const parts = pathname.replace(/^\//, '').split('/').filter(Boolean);
  return parts[0] === 'campaigns' && parts[1] === 'new';
}

export type TemplateChannel = 'whatsapp' | 'email' | 'canned';

export type TemplateEditorRoute = {
  channel: TemplateChannel | null;
  mode: 'list' | 'new' | 'edit';
  id: string | null;
};

export function templateEditorFromPath(pathname: string): TemplateEditorRoute {
  const parts = pathname.replace(/^\//, '').split('/').filter(Boolean);
  if (parts[0] !== 'templates') {
    return { channel: null, mode: 'list', id: null };
  }
  if (parts.length === 1) {
    return { channel: null, mode: 'list', id: null };
  }
  const ch = parts[1];
  if (ch !== 'whatsapp' && ch !== 'email' && ch !== 'canned') {
    return { channel: null, mode: 'list', id: null };
  }
  const channel = ch as TemplateChannel;
  if (channel === 'canned' || !parts[2]) {
    return { channel, mode: 'list', id: null };
  }
  if (parts[2] === 'new') {
    return { channel, mode: 'new', id: null };
  }
  return { channel, mode: 'edit', id: parts[2] };
}

export function pathForTemplatesList(channel?: TemplateChannel): string {
  if (channel === 'email') return '/templates/email';
  if (channel === 'whatsapp') return '/templates/whatsapp';
  if (channel === 'canned') return '/templates/canned';
  return '/templates';
}

export function pathForTemplateEditor(channel: TemplateChannel, id?: string | null): string {
  if (!id) return `/templates/${channel}/new`;
  return `/templates/${channel}/${id}`;
}

export function isTemplateSubRoute(pathname: string): boolean {
  return pathname.startsWith('/templates/');
}

export function pathForSettingsSection(section: SettingsSection): string {
  return `/settings/${section}`;
}
