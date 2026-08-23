import { api } from './api';

const META_OAUTH_VERSION = 'v19.0';

export function buildMetaOAuthDialogUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  scope: string;
  authType?: 'rerequest' | 'reauthenticate';
}): string {
  const url = new URL(`https://www.facebook.com/${META_OAUTH_VERSION}/dialog/oauth`);
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('state', params.state);
  url.searchParams.set('scope', params.scope);
  url.searchParams.set('response_type', 'code');
  if (params.authType) {
    url.searchParams.set('auth_type', params.authType);
  }
  return url.toString();
}

export const INSTAGRAM_OAUTH_REDIRECT_STORAGE_KEY = 'convosync_instagram_oauth_redirect';
export const MESSENGER_OAUTH_REDIRECT_STORAGE_KEY = 'convosync_messenger_oauth_redirect';
export const FACEBOOK_OAUTH_REDIRECT_STORAGE_KEY = 'convosync_facebook_oauth_redirect';

export const FACEBOOK_PAGE_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_read_user_content',
  'pages_manage_posts',
  'pages_manage_engagement',
  'read_insights',
  'business_management',
].join(',');

/** Starts the Facebook Page OAuth dialog and redirects the browser — no /facebook page visit needed. */
export async function startFacebookPageConnect(options?: { rerequest?: boolean }): Promise<void> {
  const metaAppId = import.meta.env.VITE_META_APP_ID;
  if (!metaAppId || metaAppId === 'your_meta_app_id_here') {
    throw new Error('Meta App ID is missing. Set VITE_META_APP_ID in frontend/.env.');
  }
  const oauth = await api.getFacebookOAuthState();
  const redirectUri = oauth.redirectUri;
  if (!redirectUri) {
    throw new Error('Missing redirect URI from server');
  }
  sessionStorage.setItem(FACEBOOK_OAUTH_REDIRECT_STORAGE_KEY, redirectUri);
  const authUrl = buildMetaOAuthDialogUrl({
    clientId: metaAppId,
    redirectUri,
    state: oauth.state,
    scope: FACEBOOK_PAGE_SCOPES,
    authType: options?.rerequest ? 'rerequest' : undefined,
  });
  window.location.assign(authUrl);
}

export const META_ADS_OAUTH_REDIRECT_STORAGE_KEY = 'convosync_meta_ads_oauth_redirect';
export const META_ADS_OAUTH_RETURN_PATH_KEY = 'convosync_meta_ads_oauth_return';

export const META_ADS_SCOPES = [
  'ads_read',
  'ads_management',
  'business_management',
].join(',');

/** Instagram DM connect — must match Meta App → Permissions (instagram_manage_messages deps). */
export const INSTAGRAM_SCOPES = [
  'instagram_basic',
  'instagram_manage_comments',
  'instagram_manage_messages',
  'pages_show_list',
  'pages_read_engagement',
  'business_management',
  'pages_manage_metadata',
  'pages_messaging',
].join(',');
