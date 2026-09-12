import { httpClient } from '@/lib/httpClient'

const REDIRECT_URI_KEY = 'convosync_shadcn_oauth_redirect'

function rememberRedirectUri(channel: string, redirectUri: string) {
  sessionStorage.setItem(`${REDIRECT_URI_KEY}:${channel}`, redirectUri)
}

export function recallRedirectUri(channel: string): string | null {
  return sessionStorage.getItem(`${REDIRECT_URI_KEY}:${channel}`)
}

function buildMetaOAuthDialogUrl(params: {
  clientId: string
  redirectUri: string
  state: string
  scope: string
}): string {
  const url = new URL('https://www.facebook.com/v19.0/dialog/oauth')
  url.searchParams.set('client_id', params.clientId)
  url.searchParams.set('redirect_uri', params.redirectUri)
  url.searchParams.set('state', params.state)
  url.searchParams.set('scope', params.scope)
  url.searchParams.set('response_type', 'code')
  return url.toString()
}

/** Instagram has a server-side convenience endpoint that returns a ready-to-open
 * dialog URL (the App ID is known server-side) — no client env var needed. */
export async function startInstagramConnect(): Promise<void> {
  const res = await httpClient.get<{ oauthDialogUrl: string; redirectUri: string }>('/instagram/connect')
  rememberRedirectUri('instagram', res.redirectUri)
  window.location.assign(res.oauthDialogUrl)
}

/** Google's oauth/state endpoint also returns a ready oauthUrl — no client env var needed. */
export async function startGoogleConnect(): Promise<void> {
  const res = await httpClient.get<{ oauthUrl: string; redirectUri: string }>('/google/oauth/state')
  rememberRedirectUri('google', res.redirectUri)
  window.location.assign(res.oauthUrl)
}

const FACEBOOK_PAGE_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_read_user_content',
  'pages_manage_posts',
  'pages_manage_engagement',
  'read_insights',
  'business_management',
].join(',')

const META_ADS_SCOPES = ['ads_read', 'ads_management', 'business_management'].join(',')

/** Facebook Page and Meta Ads have no server-side "ready URL" endpoint — the
 * client must know the Meta App ID (VITE_META_APP_ID). This app doesn't have
 * one configured, so this throws with a clear message rather than silently
 * failing — matching how the reference app behaves when unconfigured. */
async function startClientBuiltMetaConnect(
  channel: 'facebook' | 'meta_ads',
  statePath: string,
  scope: string
): Promise<void> {
  const clientId = import.meta.env.VITE_META_APP_ID as string | undefined
  if (!clientId) {
    throw new Error(
      'Meta App ID is not configured for this app (VITE_META_APP_ID). This connect flow needs a real Meta App with OAuth redirect URIs set up.'
    )
  }
  const res = await httpClient.get<{ state: string; redirectUri: string }>(statePath)
  rememberRedirectUri(channel, res.redirectUri)
  const url = buildMetaOAuthDialogUrl({ clientId, redirectUri: res.redirectUri, state: res.state, scope })
  window.location.assign(url)
}

export function startFacebookConnect(): Promise<void> {
  return startClientBuiltMetaConnect('facebook', '/facebook/oauth/state', FACEBOOK_PAGE_SCOPES)
}

export function startMetaAdsConnect(): Promise<void> {
  return startClientBuiltMetaConnect('meta_ads', '/meta-ads/oauth/state', META_ADS_SCOPES)
}

/** Instagram Login (no Facebook Page required) — server returns the dialog URL. */
export async function startInstagramBusinessLogin(): Promise<void> {
  const res = await httpClient.get<{ oauthDialogUrl: string; redirectUri: string }>(
    '/instagram-business-login/connect'
  )
  rememberRedirectUri('instagram_business_login', res.redirectUri)
  window.location.assign(res.oauthDialogUrl)
}

export const META_ADS_CONNECT_ERROR_KEY = 'convosync_shadcn_meta_ads_connect_error'

export function readStoredConnectError(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

export function clearStoredConnectError(key: string): void {
  try {
    sessionStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export function storeConnectError(key: string, message: string): void {
  try {
    sessionStorage.setItem(key, message)
  } catch {
    /* ignore */
  }
}
