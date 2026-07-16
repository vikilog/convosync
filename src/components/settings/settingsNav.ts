import type { SettingsSection } from '../../routes';

export type SettingsNavItem = {
  id: SettingsSection;
  label: string;
};

export type SettingsNavGroup = {
  title: string;
  items: SettingsNavItem[];
};

/** Settings sidebar sections hidden until these modules are ready for general release. */
export const SETTINGS_HIDDEN_SECTIONS = new Set<SettingsSection>([
  'security',
  'holidays',
  'ai-provider',
  'subscription',
  'billing',
  'recharge',
  'contact-attributes',
  'contact-tags',
  'contact-events',
  'inbox-tags',
  'canned-response',
  'ai-copilot',
  'ai-knowledge',
  'calling-tags',
]);

export const SETTINGS_NAV: SettingsNavGroup[] = [
  {
    title: 'General settings',
    items: [
      { id: 'profile', label: 'My profile' },
      { id: 'company-info', label: 'Company info' },
      { id: 'users', label: 'Users and teams' },
    ],
  },
  {
    title: 'Billing',
    items: [
      { id: 'wallet', label: 'Wallet' },
      { id: 'invoices', label: 'Invoice logs' },
    ],
  },
];

export const SETTINGS_SECTION_TITLES: Record<SettingsSection, string> = {
  profile: 'My profile',
  'company-info': 'Company info',
  users: 'Users and teams',
  security: 'Security',
  holidays: 'Holidays',
  notifications: 'Notifications',
  wallet: 'Wallet',
  subscription: 'Subscription',
  billing: 'Billing overview',
  recharge: 'ConvoCoins',
  invoices: 'Invoice logs',
  'contact-attributes': 'Attributes',
  'contact-tags': 'Tags',
  'contact-events': 'Custom events',
  'inbox-tags': 'Conversation tags',
  'canned-response': 'Canned response',
  'ai-copilot': 'AI Copilot',
  'ai-knowledge': 'AI Knowledge',
  'ai-provider': 'AI Provider',
  'calling-tags': 'Calling tags',
};
