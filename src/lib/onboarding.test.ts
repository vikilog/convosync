import { describe, expect, it } from 'vitest'

import {
  emptyOnboardingForm,
  onboardingStepPayload,
  validateOnboardingStep,
  type OnboardingFormState,
} from './onboarding'

const base = (): OnboardingFormState => ({
  ...emptyOnboardingForm('+91'),
  accountType: 'company',
  name: 'Ada Lovelace',
  phone: '9876543210',
  jobTitle: 'Founder',
  companyName: 'ConvoSync',
  companySize: '2-10',
  industry: 'SaaS / Technology',
  country: 'IN',
  timezone: 'Asia/Kolkata',
  useCases: ['customer_support'],
  workspaceName: 'Ada HQ',
})

describe('validateOnboardingStep', () => {
  it('requires account type, profile, company, use case, and workspace', () => {
    expect(validateOnboardingStep(1, emptyOnboardingForm('+91'))).toMatch(/how you plan/)
    expect(validateOnboardingStep(2, { ...base(), name: 'A' })).toMatch(/Full name/)
    expect(validateOnboardingStep(3, { ...base(), companyName: 'https://x.com' })).toMatch(/cannot be a URL/)
    expect(validateOnboardingStep(4, { ...base(), useCases: [] })).toMatch(/use case/)
    expect(validateOnboardingStep(5, base())).toBeNull()
    expect(validateOnboardingStep(6, { ...base(), workspaceName: '  ' })).toMatch(/Workspace name/)
  })

  it('accepts a completed company flow', () => {
    const form = base()
    expect([1, 2, 3, 4, 6].every((step) => validateOnboardingStep(step, form) === null)).toBe(true)
  })
})

describe('onboardingStepPayload', () => {
  it('composes E.164 phone and company vs individual step 3', () => {
    const form = base()
    expect(onboardingStepPayload(2, form, () => '+919876543210')).toEqual({
      name: 'Ada Lovelace',
      phone: '+919876543210',
      jobTitle: 'Founder',
    })
    expect(onboardingStepPayload(3, form, () => '')).toMatchObject({
      companyName: 'ConvoSync',
      industry: 'SaaS / Technology',
    })
    expect(
      onboardingStepPayload(3, { ...form, accountType: 'individual', displayName: 'Ada' }, () => ''),
    ).toEqual({
      displayName: 'Ada',
      country: 'IN',
      timezone: 'Asia/Kolkata',
    })
  })
})
