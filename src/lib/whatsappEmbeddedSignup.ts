const FB_ORIGIN = 'https://www.facebook.com'

export type EmbeddedSession = {
  wabaId?: string
  phoneNumberId?: string
  businessId?: string
}

export type EmbeddedSignupMessageResult =
  | { kind: 'session'; session: EmbeddedSession }
  | { kind: 'fail'; message: string }
  | null

export function isFacebookMessageOrigin(origin: string): boolean {
  return origin === FB_ORIGIN || origin.endsWith('.facebook.com')
}

export function parseEmbeddedSignupMessage(event: MessageEvent): EmbeddedSignupMessageResult {
  if (!isFacebookMessageOrigin(event.origin)) return null

  try {
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
    if (data?.type !== 'WA_EMBEDDED_SIGNUP') return null

    if (data.event === 'CANCEL') {
      if (data.data?.error_message || data.data?.error_code) {
        return {
          kind: 'fail',
          message: [data.data.error_message, data.data.error_code && `Code: ${data.data.error_code}`]
            .filter(Boolean)
            .join(' '),
        }
      }
      return { kind: 'fail', message: 'User cancelled the signup flow' }
    }

    if (data.event === 'ERROR') {
      return { kind: 'fail', message: data.data?.error_message || 'Signup failed' }
    }

    if (
      data.event === 'FINISH' ||
      data.event === 'FINISH_ONLY_WABA' ||
      data.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING'
    ) {
      const { waba_id, phone_number_id, business_id } = data.data || {}
      return {
        kind: 'session',
        session: {
          wabaId: waba_id,
          phoneNumberId: phone_number_id,
          businessId: business_id,
        },
      }
    }
  } catch {
    return null
  }

  return null
}

export function getEmbeddedSignupRedirectUri(): string {
  const fromEnv =
    (import.meta.env.VITE_META_EMBEDDED_REDIRECT_URI as string | undefined) ||
    (import.meta.env.VITE_META_OAUTH_REDIRECT_URI as string | undefined)
  if (fromEnv) {
    return fromEnv.split('?')[0].replace(/\/$/, '') || fromEnv
  }
  return `${window.location.origin}${window.location.pathname}`
}

export function getBusinessApiConfigId(): string | undefined {
  return (
    (import.meta.env.VITE_META_CONFIG_ID as string | undefined) ||
    (import.meta.env.VITE_META_CONFIGURATION_ID as string | undefined) ||
    undefined
  )
}

export function buildEmbeddedSignupExtras(isCoexistence: boolean) {
  return {
    setup: {},
    featureType: isCoexistence ? 'whatsapp_business_app_onboarding' : '',
    sessionInfoVersion: '3',
  }
}
