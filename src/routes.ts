export const VALID_TABS = [
  'dashboard',
  'manager',
  'inbox',
  'team-chat',
  'contacts',
  'calling',
  'campaigns',
  'templates',
  'automations',
  'journey',
  'instagram-automation',
  'ai-agent',
  'media-gallery',
  'social-listening',
  'leads',
  'data',
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
  'automation',
  'inbox-behavior',
  'security',
  'holidays',
  'alerts',
  'wallet',
  'usage',
  'web-widget',
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
  // Nested builders share the Automations tab
  if (segment === 'automations') return 'automations';
  // Legacy top-level builder URLs (redirected in App) — keep tab highlight correct mid-nav
  if (segment === 'journey' || segment === 'instagram-automation') return 'automations';
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
  if (segment === 'billing' || segment === 'recharge') {
    return 'wallet';
  }
  // Legacy path — page renamed from Notifications → Alerts
  if (segment === 'notifications') return 'alerts';
  if (segment && SETTINGS_SECTIONS.includes(segment as SettingsSection)) {
    return segment as SettingsSection;
  }
  return 'company-info';
}

export function pathForTab(tab: string): string {
  if (tab === 'settings') return '/settings/company-info';
  if (tab === 'social-listening') return '/social-listening/dashboard';
  if (tab === 'contacts') return '/contacts/list';
  if (tab === 'leads') return '/leads';
  if (tab === 'journey' || tab === 'instagram-automation' || tab === 'automations') {
    return '/automations';
  }
  return `/${tab}`;
}

/** /automations/whatsapp-automation/... */
export function pathForJourneyGallery(): string {
  return '/automations/whatsapp-automation/gallery';
}

export function isJourneyGalleryPath(pathname: string): boolean {
  const parts = pathname.replace(/^\//, '').split('/').filter(Boolean);
  return (
    (parts[0] === 'automations' && parts[1] === 'whatsapp-automation' && parts[2] === 'gallery') ||
    (parts[0] === 'journey' && parts[1] === 'gallery')
  );
}

/** Builder URL — /automations/whatsapp-automation/:id */
export function pathForJourney(journeyId: string): string {
  return `/automations/whatsapp-automation/${journeyId}`;
}

export function journeyIdFromPath(pathname: string): string | null {
  const parts = pathname.replace(/^\//, '').split('/').filter(Boolean);
  if (parts[0] === 'automations' && parts[1] === 'whatsapp-automation') {
    const id = parts[2];
    if (!id || id === 'gallery') return null;
    return id;
  }
  // Legacy /journey/:id
  if (parts[0] === 'journey') {
    const id = parts[1];
    if (!id || id === 'gallery') return null;
    return id;
  }
  return null;
}

export function isWhatsAppAutomationPath(pathname: string): boolean {
  const parts = pathname.replace(/^\//, '').split('/').filter(Boolean);
  return (
    (parts[0] === 'automations' && parts[1] === 'whatsapp-automation') ||
    parts[0] === 'journey'
  );
}

/** Builder URL — /automations/instagram-automation/:id */
export function pathForInstagramAutomation(journeyId: string): string {
  return `/automations/instagram-automation/${journeyId}`;
}

export function instagramAutomationIdFromPath(pathname: string): string | null {
  const parts = pathname.replace(/^\//, '').split('/').filter(Boolean);
  if (parts[0] === 'automations' && parts[1] === 'instagram-automation' && parts[2]) {
    return parts[2];
  }
  // Legacy /instagram-automation/:id
  if (parts[0] === 'instagram-automation' && parts[1]) {
    return parts[1];
  }
  return null;
}

export function isInstagramAutomationPath(pathname: string): boolean {
  const parts = pathname.replace(/^\//, '').split('/').filter(Boolean);
  return (
    (parts[0] === 'automations' && parts[1] === 'instagram-automation') ||
    parts[0] === 'instagram-automation'
  );
}

export type IntegrationsChannel =
  | 'whatsapp'
  | 'whatsapp-coexistence'
  | 'email'
  | 'ai'
  | 'instagram'
  | 'google'
  | 'meta-ads'
  | 'google-ads'
  | 'messenger'
  | 'telegram';

/** Email + AI + Telegram use path pages; WhatsApp / Instagram (and others for now) use ?channel=. */
export function pathForIntegrationsChannel(channel: IntegrationsChannel): string {
  if (channel === 'email') return '/integrations/email';
  if (channel === 'ai') return '/integrations/ai';
  if (channel === 'telegram') return '/integrations/telegram';
  return `/integrations?channel=${channel}`;
}

export function integrationsSubpageFromPath(pathname: string): 'email' | 'ai' | 'telegram' | null {
  const parts = pathname.replace(/^\//, '').split('/').filter(Boolean);
  if (parts[0] !== 'integrations') return null;
  if (parts[1] === 'email' || parts[1] === 'ai' || parts[1] === 'telegram') return parts[1];
  return null;
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

export function contactIdFromPath(pathname: string): string | null {
  const parts = pathname.replace(/^\//, '').split('/').filter(Boolean);
  if (parts[0] !== 'contacts' || !parts[1]) return null;
  if (parts[1] === 'dashboard' || parts[1] === 'list') return null;
  return parts[1];
}

export function contactsSectionFromPath(
  pathname: string
): 'dashboard' | 'list' | 'detail' {
  const parts = pathname.replace(/^\//, '').split('/').filter(Boolean);
  if (parts[0] !== 'contacts') return 'list';
  if (!parts[1] || parts[1] === 'list') return 'list';
  if (parts[1] === 'dashboard') return 'dashboard';
  return 'detail';
}

export function pathForContactsDashboard(): string {
  return '/contacts/dashboard';
}

export function pathForContactsList(): string {
  return '/contacts/list';
}

export function pathForContact(contactId: string): string {
  return `/contacts/${contactId}`;
}

export function leadFunnelIdFromPath(pathname: string): string | null {
  const parts = pathname.replace(/^\//, '').split('/').filter(Boolean);
  if (parts[0] !== 'leads' || !parts[1]) return null;
  return parts[1];
}

export function pathForLeadFunnel(funnelId: string): string {
  return `/leads/${funnelId}`;
}

export type TemplateChannel = 'whatsapp' | 'email' | 'canned' | 'flow';

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
  if (ch !== 'whatsapp' && ch !== 'email' && ch !== 'canned' && ch !== 'flow') {
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
  if (channel === 'flow') return '/templates/flow';
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
