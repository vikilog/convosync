export type IntegrationChannel =
  | 'whatsapp'
  | 'whatsapp_coexistence'
  | 'instagram'
  | 'messenger'
  | 'facebook'
  | 'telegram'
  | 'email'
  | 'ai_provider'
  | 'whatsapp_flow'
  | 'meta_ads'
  | 'google'
  | 'virtual_number'

export type WhatsAppSignupMode = 'business_api' | 'app_coexistence'

export type ConnectionHealth = 'live' | 'expiring_soon' | 'error' | 'expired' | 'revoked'

export type ConnectedIntegration = {
  id: string
  channel: IntegrationChannel
  channelLabel: string
  title: string
  subtitle: string
  detail?: string
  health: ConnectionHealth
}

export type AvailableIntegration = {
  id: string
  channel: IntegrationChannel
  title: string
  description: string
  connectLabel?: string
  disabled?: boolean
}

// ---- WhatsApp (status only — Embedded Signup connect flow is out of scope) ----

export type WhatsAppAccount = {
  id: string
  phoneNumberId: string
  phoneNumber: string | null
  displayName: string | null
  wabaId: string | null
  connectionMode: 'business_api' | 'app_coexistence'
  label?: string | null
}

export type WhatsAppStatus = {
  connected: boolean
  phoneNumber: string | null
  phoneNumberId: string | null
  wabaId: string | null
  accounts: WhatsAppAccount[]
  coexistenceConnected: boolean
}

export type WhatsAppFullAccount = {
  id: string
  phoneNumberId: string
  wabaId: string | null
  phoneNumber: string | null
  displayName: string | null
  connectionMode: 'business_api' | 'app_coexistence'
  paymentMode: 'self_pay' | 'platform' | null
  hasOwnMetaPaymentMethod: boolean
  metaBusinessId: string | null
  label: string
  status: string
  verified: boolean
}

export type WhatsAppPaymentStatus = {
  phoneNumberId: string
  wabaId: string
  paymentMode: 'self_pay' | 'platform' | null
  hasOwnMetaPaymentMethod: boolean
  billingCheckStatus: 'confirmed' | 'missing' | 'unknown'
  paymentConfigCheckedAt: string | null
  paymentSetupAcknowledgedAt: string | null
  metaBusinessId: string | null
  metaPaymentSetupUrl: string
  primaryFundingId?: string | null
  note?: string
  error?: string
}

export type WhatsAppBusinessProfile = {
  about: string
  address: string
  description: string
  email: string
  websites: string[]
  vertical: string
  profilePictureUrl: string | null
}

export type WhatsAppBusinessProfileBundle = {
  phoneNumberId: string
  displayPhoneNumber: string | null
  verifiedName: string | null
  qualityRating: string | null
  nameStatus: string | null
  profile: WhatsAppBusinessProfile
  verticals: string[]
}

export type WhatsAppBusinessProfileUpdate = Partial<{
  about: string
  address: string
  description: string
  email: string
  websites: string[]
  vertical: string
}>

// ---- Instagram ----

/** Backend value is 'connected', not 'live' — everything else lines up with ConnectionHealth. */
export type InstagramStatusLabel = 'connected' | 'expiring_soon' | 'expired' | 'error' | 'revoked'

export type InstagramAccount = {
  id: string
  instagramUserId: string
  username: string | null
  displayName: string | null
  label: string
  statusLabel: InstagramStatusLabel
}

export function instagramHealth(statusLabel: InstagramStatusLabel): ConnectionHealth {
  return statusLabel === 'connected' ? 'live' : statusLabel
}

// ---- Messenger ----

export type MessengerAccount = {
  id: string
  pageId: string
  pageName: string | null
  displayName: string | null
  label: string
}

// ---- Facebook Page ----

export type FacebookPageStatus =
  | { connected: false }
  | {
      connected: true
      page: { id: string; name: string; category: string | null; followersCount: number | null }
      tokenValid?: boolean
    }

// ---- Telegram ----

export type TelegramAccount = {
  id: string
  botId: string
  botUsername: string | null
  botName: string | null
  label: string
}

// ---- Email ----

export type EmailIntegrationStatus = {
  enabled: boolean
  defaultSenderEmail: string | null
  defaultSenderName: string | null
  verifiedDomainCount: number
  providerLabel: string | null
  activeDomain: string | null
}

export type EmailDnsRecord = {
  type: string
  name: string
  value: string
  status?: 'pending' | 'verified' | 'failed'
}

export type EmailDomain = {
  id: string
  domain: string
  provider: string
  status: 'pending' | 'verified' | 'failed'
  spfVerified: boolean
  dkimVerified: boolean
  dmarcVerified: boolean
  dnsRecords?: unknown
  verifiedAt: string | null
  createdAt: string
}

export function parseEmailDnsRecords(raw: unknown): EmailDnsRecord[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((row) => {
    if (!row || typeof row !== 'object') return []
    const rec = row as Record<string, unknown>
    if (typeof rec.name !== 'string' || typeof rec.value !== 'string') return []
    return [
      {
        type: typeof rec.type === 'string' ? rec.type : 'TXT',
        name: rec.name,
        value: rec.value,
        status:
          rec.status === 'pending' || rec.status === 'verified' || rec.status === 'failed'
            ? rec.status
            : undefined,
      },
    ]
  })
}

export type EmailProviderType = 'CONVOSYNC_MANAGED' | 'RESEND' | 'AWS_SES' | 'SENDGRID' | 'SMTP'
export type EmailProviderStatus = 'active' | 'disabled' | 'credentials_missing' | 'connection_failed'

export type EmailProviderConfig = {
  id: string
  provider: EmailProviderType
  isDefault: boolean
  status: EmailProviderStatus
  hasCredentials: boolean
  createdAt: string
  updatedAt: string
  region?: string | null
  senderEmail?: string | null
  accessKeyIdMasked?: string | null
}

export type NewEmailProviderInput =
  | { provider: 'RESEND'; config: { apiKey: string } }
  | { provider: 'SENDGRID'; config: { apiKey: string } }
  | {
      provider: 'AWS_SES'
      config: { accessKeyId: string; secretAccessKey: string; region: string; senderEmail?: string }
    }
  | {
      provider: 'SMTP'
      config: { host: string; port: number; secure: boolean; username: string; password: string }
    }

export type EmailLog = {
  id: string
  sender: string
  recipient: string
  subject: string
  provider: string
  providerName: string | null
  status: string
  messageId: string | null
  errorMessage: string | null
  createdAt: string
}

// ---- Meta Ads ----

export type MetaAdsAccount = {
  id: string
  name: string
  currency: string
  status: string
  timezone?: string
  balance?: number
}

export type MetaAdsStatus =
  | { connected: false }
  | {
      connected: true
      account: MetaAdsAccount
    }

export type MetaAdAccountOption = {
  id: string
  name: string
  currency: string
  status: string
  campaignCount: number
  isSelected: boolean
}

// ---- Google ----

export type GoogleConnection = {
  id: string
  email: string
  displayName: string | null
  pictureUrl?: string | null
  status: 'active' | 'expired' | 'revoked' | 'error' | string
  createdAt: string
}

export type GoogleProductKey = 'calendar' | 'business_profile' | 'sheets' | 'drive' | 'gmail' | 'meet'

export type GoogleProductSummary = {
  product: GoogleProductKey
  label: string
  description: string
  status: string
  connectionId: string | null
  connectionEmail: string | null
  lastSyncAt: string | null
  lastError: string | null
  syncCount: number
  config: Record<string, unknown> | null
}

export const HUB_GOOGLE_PRODUCTS: GoogleProductKey[] = [
  'business_profile',
  'gmail',
  'calendar',
  'sheets',
  'drive',
]

export type WhatsAppConnectInput = {
  code: string
  redirectUri: string
  wabaId?: string
  phoneNumberId?: string
  businessId?: string
  connectionMode?: WhatsAppSignupMode
}

export type WhatsAppConnectResult = {
  phoneNumber: string
  phoneNumberId: string
  wabaId: string
  displayName?: string
  businessId?: string
  needsPaymentMode?: boolean
  connectionMode?: WhatsAppSignupMode
}

// ---- AI Provider ----

export type AiProviderMode = 'convosync' | 'byok'
export type AiProviderType = 'openai' | 'anthropic' | 'custom'
export type AiProviderStatus = 'active' | 'credentials_missing' | 'connection_failed'

export type AiProviderConfig = {
  mode: AiProviderMode
  provider: AiProviderType
  model: string
  baseUrl: string | null
  hasApiKey: boolean
  status: AiProviderStatus
  lastTestedAt: string | null
  availableModels: string[]
}

export type AiProviderUpdateInput = Partial<{
  mode: AiProviderMode
  provider: AiProviderType
  model: string
  apiKey: string
  baseUrl: string | null
}>

// ---- WhatsApp Flow ----

export type WhatsAppFlowStatus = { enabled: boolean; requestedAt: string | null }
