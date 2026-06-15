export type ComparisonRow = {
  id: string;
  label: string;
  businessApi: string;
  coexistence: string;
};

export const CONNECTION_COMPARISON_ROWS: ComparisonRow[] = [
  {
    id: 'number-type',
    label: 'Number Type',
    businessApi: 'New or Dedicated Number',
    coexistence: 'Existing WhatsApp Business Number',
  },
  {
    id: 'mobile-app',
    label: 'Mobile App Usage',
    businessApi: 'Not Required',
    coexistence: 'Continue Using Mobile App',
  },
  {
    id: 'automation',
    label: 'Automation Level',
    businessApi: 'Full Automation',
    coexistence: 'Automation + Mobile Access',
  },
  {
    id: 'best-for',
    label: 'Best For',
    businessApi: 'Growing businesses',
    coexistence: 'Existing WhatsApp users',
  },
  {
    id: 'setup',
    label: 'Setup Complexity',
    businessApi: 'Medium',
    coexistence: 'Easy',
  },
];

export const CONNECTION_SIDEBAR_BENEFITS = [
  'Reach customers instantly',
  'Automate conversations',
  'AI-powered customer support',
  'Team collaboration',
  'Marketing campaigns',
  'Appointment booking',
] as const;
