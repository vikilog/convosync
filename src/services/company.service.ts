import { createSingletonResource } from '@/hooks/data/createSingletonResource'

export type WhatsAppAccountSummary = {
  id: string
  displayNumber?: string | null
  [key: string]: unknown
}

export type CompanySettings = {
  id: string
  name: string
  slug: string
  legalName: string | null
  industry: string | null
  website: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  postalCode: string | null
  timezone: string | null
  taxId: string | null
  logoUrl: string | null
  plan?: { name: string; slug: string } | null
  whatsappAccounts: WhatsAppAccountSummary[]
  connected: boolean
  trial?: unknown
  [key: string]: unknown
}

export type CompanySettingsPatch = Partial<
  Pick<
    CompanySettings,
    | 'name'
    | 'legalName'
    | 'industry'
    | 'website'
    | 'email'
    | 'phone'
    | 'address'
    | 'city'
    | 'state'
    | 'country'
    | 'postalCode'
    | 'timezone'
    | 'taxId'
    | 'logoUrl'
  >
>

export const companyResource = createSingletonResource<CompanySettings, CompanySettingsPatch>(
  'companySettings',
  '/workspace/company'
)
