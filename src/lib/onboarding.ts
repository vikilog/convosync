export const ONBOARDING_TOTAL_STEPS = 7;

export const OPTIONAL_STEPS = [5] as const;

export type AccountType = 'company' | 'freelancer' | 'individual';

export type OnboardingState = {
  onboardingStep: number;
  onboardingCompleted: boolean;
  onboardingSkippedSteps: number[];
  onboardingData: Record<string, unknown>;
  progressPercent: number;
  accountType: AccountType | null;
  user: {
    name: string;
    email: string;
    phone: string | null;
    jobTitle: string | null;
  };
  workspace: {
    id: string;
    name: string;
    industry: string | null;
    country: string | null;
    timezone: string | null;
    companySize: string | null;
    useCases: string[];
    heardAbout: string | null;
    referralCode: string | null;
  };
};

export const ONBOARDING_STEP_LABELS = [
  'Welcome',
  'Profile',
  'Organization',
  'Use case',
  'Discovery',
  'Workspace',
  'Review',
] as const;

export const ACCOUNT_TYPES: { id: AccountType; label: string; description: string }[] = [
  {
    id: 'company',
    label: 'Company',
    description: 'A business or team using ConvoSync for customer communication.',
  },
  {
    id: 'freelancer',
    label: 'Freelancer',
    description: 'Solo professional managing client conversations.',
  },
  {
    id: 'individual',
    label: 'Individual',
    description: 'Personal or side-project use without a formal company.',
  },
];

export const USE_CASE_OPTIONS = [
  { id: 'customer_support', label: 'Customer support' },
  { id: 'marketing', label: 'Marketing & broadcasts' },
  { id: 'sales', label: 'Sales & lead nurturing' },
  { id: 'notifications', label: 'Transactional notifications' },
  { id: 'automation', label: 'Automation & journeys' },
  { id: 'team_inbox', label: 'Team inbox collaboration' },
] as const;

export const COMPANY_SIZES = [
  '1',
  '2-10',
  '11-50',
  '51-200',
  '201-500',
  '500+',
] as const;

export const INDUSTRIES = [
  'E-commerce',
  'SaaS / Technology',
  'Healthcare',
  'Education',
  'Real estate',
  'Finance',
  'Hospitality',
  'Retail',
  'Agency',
  'Other',
] as const;

export const HEARD_ABOUT_OPTIONS = [
  'Google search',
  'Social media',
  'Friend or colleague',
  'YouTube / Podcast',
  'Blog or article',
  'Meta partner',
  'Event or conference',
  'Other',
] as const;

export const TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'Australia/Sydney',
] as const;

export const COUNTRIES = [
  { code: 'IN', label: 'India' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'AE', label: 'United Arab Emirates' },
  { code: 'SG', label: 'Singapore' },
  { code: 'AU', label: 'Australia' },
  { code: 'DE', label: 'Germany' },
  { code: 'CA', label: 'Canada' },
] as const;

export function isStepOptional(step: number) {
  return (OPTIONAL_STEPS as readonly number[]).includes(step);
}

export function calcDisplayProgress(state: Pick<OnboardingState, 'onboardingCompleted' | 'progressPercent'>) {
  return state.onboardingCompleted ? 100 : state.progressPercent;
}
