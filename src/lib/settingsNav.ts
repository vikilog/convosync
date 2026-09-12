export const SETTINGS_SECTIONS = [
  'profile',
  'company-info',
  'users',
  'automation',
  'inbox-behavior',
  'alerts',
  'canned-response',
  'subscription',
  'wallet',
  'usage',
  'invoices',
  'web-widget',
  'ai-knowledge',
  'ai-provider',
] as const

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number]

export function isSettingsSection(value: string | null): value is SettingsSection {
  return value != null && (SETTINGS_SECTIONS as readonly string[]).includes(value)
}

export type SettingsNavGroup = {
  title: string
  items: { id: SettingsSection; label: string }[]
}

export const SETTINGS_NAV: SettingsNavGroup[] = [
  {
    title: 'General settings',
    items: [
      { id: 'profile', label: 'My profile' },
      { id: 'company-info', label: 'Company info' },
      { id: 'users', label: 'Users and teams' },
      { id: 'automation', label: 'Automation' },
      { id: 'inbox-behavior', label: 'Inbox Behavior' },
      { id: 'alerts', label: 'Human Handoff' },
      { id: 'canned-response', label: 'Canned response' },
    ],
  },
  {
    title: 'Billing',
    items: [
      { id: 'subscription', label: 'Plans' },
      { id: 'wallet', label: 'Wallet' },
      { id: 'usage', label: 'Usage' },
      { id: 'invoices', label: 'Invoice logs' },
    ],
  },
  {
    title: 'AI',
    items: [
      { id: 'web-widget', label: 'Website Widget' },
      { id: 'ai-knowledge', label: 'AI Knowledge' },
      { id: 'ai-provider', label: 'AI Provider' },
    ],
  },
]

export const SETTINGS_SECTION_SUBTITLE: Record<SettingsSection, string> = {
  profile: 'Manage your personal account details.',
  'company-info': 'Manage your workspace and business details.',
  users: 'Invite teammates and manage roles and permissions.',
  automation: 'Pause automations, default reply, persistent menu, and your workspace tag registry.',
  'inbox-behavior': 'Auto-assign new conversations to your team.',
  alerts: 'Choose channels and recipients when AI escalates to a human.',
  subscription: 'Your current plan, upgrades, and the full pricing catalog.',
  wallet: 'ConvoCoins balance, usage rates, and wallet top-ups.',
  usage: 'Token usage and cost breakdown across messaging, AI, and calling.',
  invoices: 'Payment and order IDs for charges, renewals, and add-ons.',
  'web-widget': 'Embed an AI chat bubble on your own website.',
  'ai-knowledge': 'Sync venue knowledge from an external salon database.',
  'canned-response': 'Saved replies with shortcuts and optional media for Inbox.',
  'ai-provider': 'Use managed AI or connect your own provider key for agents and automations.',
}
