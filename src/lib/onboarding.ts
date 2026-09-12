export const ONBOARDING_TOTAL_STEPS = 7

export const OPTIONAL_STEPS = [5] as const

export type AccountType = 'company' | 'freelancer' | 'individual'

export type OnboardingState = {
  onboardingStep: number
  onboardingCompleted: boolean
  onboardingSkippedSteps: number[]
  onboardingData: Record<string, unknown>
  progressPercent: number
  accountType: AccountType | null
  user: {
    name: string
    email: string
    phone: string | null
    jobTitle: string | null
  }
  workspace: {
    id: string
    name: string
    industry: string | null
    country: string | null
    timezone: string | null
    companySize: string | null
    useCases: string[]
    heardAbout: string | null
    referralCode: string | null
  }
}

export type OnboardingFormState = {
  accountType: AccountType | ''
  name: string
  phone: string
  phoneDial: string
  jobTitle: string
  companyName: string
  displayName: string
  companySize: string
  industry: string
  country: string
  useCases: string[]
  heardAbout: string
  referralCode: string
  workspaceName: string
  timezone: string
}

export const ONBOARDING_STEP_LABELS = [
  'Welcome',
  'Profile',
  'Organization',
  'Use case',
  'Discovery',
  'Workspace',
  'Review',
] as const

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
]

export const USE_CASE_OPTIONS = [
  { id: 'customer_support', label: 'Customer support' },
  { id: 'marketing', label: 'Marketing & broadcasts' },
  { id: 'sales', label: 'Sales & lead nurturing' },
  { id: 'notifications', label: 'Transactional notifications' },
  { id: 'automation', label: 'Automation & journeys' },
  { id: 'team_inbox', label: 'Team inbox collaboration' },
] as const

export const COMPANY_SIZES = ['1', '2-10', '11-50', '51-200', '201-500', '500+'] as const

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
] as const

export const HEARD_ABOUT_OPTIONS = [
  'Google search',
  'Social media',
  'Friend or colleague',
  'YouTube / Podcast',
  'Blog or article',
  'Meta partner',
  'Event or conference',
  'Other',
] as const

export function isStepOptional(step: number) {
  return (OPTIONAL_STEPS as readonly number[]).includes(step)
}

export function emptyOnboardingForm(phoneDial: string): OnboardingFormState {
  return {
    accountType: '',
    name: '',
    phone: '',
    phoneDial,
    jobTitle: '',
    companyName: '',
    displayName: '',
    companySize: '',
    industry: '',
    country: 'IN',
    useCases: [],
    heardAbout: '',
    referralCode: '',
    workspaceName: '',
    timezone: 'Asia/Kolkata',
  }
}

export function stateToForm(
  state: OnboardingState,
  splitPhone: (phone: string | null, country?: string | null) => { dial: string; national: string },
): OnboardingFormState {
  const step3 = (state.onboardingData.step3 as Record<string, string> | undefined) ?? {}
  const country = state.workspace.country ?? 'IN'
  const { dial, national } = splitPhone(state.user.phone, country)
  return {
    accountType: state.accountType ?? '',
    name: state.user.name ?? '',
    phone: national,
    phoneDial: dial,
    jobTitle: state.user.jobTitle ?? '',
    companyName: step3.companyName ?? state.workspace.name ?? '',
    displayName: step3.displayName ?? state.workspace.name ?? '',
    companySize: state.workspace.companySize ?? '',
    industry: state.workspace.industry ?? '',
    country,
    useCases: state.workspace.useCases ?? [],
    heardAbout: state.workspace.heardAbout ?? '',
    referralCode: state.workspace.referralCode ?? '',
    workspaceName: state.workspace.name ?? '',
    timezone: state.workspace.timezone ?? 'Asia/Kolkata',
  }
}

function looksLikeUrl(value: string) {
  return /https?:\/\//i.test(value) || /^www\./i.test(value.trim())
}

export function validateOnboardingStep(step: number, form: OnboardingFormState): string | null {
  switch (step) {
    case 1:
      return form.accountType ? null : 'Please select how you plan to use ConvoSync.'
    case 2:
      if (!form.name.trim() || form.name.trim().length < 2) return 'Full name is required.'
      if (!form.phone.trim()) return 'Phone number is required.'
      if (!form.jobTitle.trim()) return 'Role or job title is required.'
      return null
    case 3:
      if (form.accountType === 'company') {
        if (!form.companyName.trim()) return 'Company name is required.'
        if (looksLikeUrl(form.companyName)) return 'Company name cannot be a URL.'
        if (!form.companySize) return 'Company size is required.'
        if (!form.industry) return 'Industry is required.'
        if (!form.country) return 'Country is required.'
        if (!form.timezone) return 'Timezone is required.'
      } else {
        if (!form.displayName.trim()) return 'Display or business name is required.'
        if (looksLikeUrl(form.displayName)) return 'Business name cannot be a URL.'
        if (!form.country) return 'Country is required.'
        if (!form.timezone) return 'Timezone is required.'
      }
      return null
    case 4:
      return form.useCases.length > 0 ? null : 'Select at least one use case.'
    case 5:
      return null
    case 6:
      return form.workspaceName.trim() ? null : 'Workspace name is required.'
    default:
      return null
  }
}

export function onboardingStepPayload(
  step: number,
  form: OnboardingFormState,
  toE164: (dial: string, national: string) => string,
): Record<string, unknown> {
  switch (step) {
    case 1:
      return { accountType: form.accountType }
    case 2:
      return {
        name: form.name.trim(),
        phone: toE164(form.phoneDial, form.phone),
        jobTitle: form.jobTitle.trim(),
      }
    case 3:
      return form.accountType === 'company'
        ? {
            companyName: form.companyName.trim(),
            companySize: form.companySize,
            industry: form.industry,
            country: form.country,
            timezone: form.timezone,
          }
        : {
            displayName: form.displayName.trim(),
            country: form.country,
            timezone: form.timezone,
          }
    case 4:
      return { useCases: form.useCases }
    case 5:
      return { heardAbout: form.heardAbout, referralCode: form.referralCode.trim() }
    case 6:
      return { workspaceName: form.workspaceName.trim(), timezone: form.timezone }
    default:
      return {}
  }
}
