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

export const INSTAGRAM_OAUTH_REDIRECT_STORAGE_KEY = 'wabiz_instagram_oauth_redirect';
export const MESSENGER_OAUTH_REDIRECT_STORAGE_KEY = 'wabiz_messenger_oauth_redirect';
export const FACEBOOK_OAUTH_REDIRECT_STORAGE_KEY = 'wabiz_facebook_oauth_redirect';

export const FACEBOOK_PAGE_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_read_user_content',
  'pages_manage_posts',
  'pages_manage_engagement',
  'read_insights',
  'business_management',
].join(',');

export const META_ADS_OAUTH_REDIRECT_STORAGE_KEY = 'wabiz_meta_ads_oauth_redirect';

export const META_ADS_SCOPES = [
  'ads_read',
  'ads_management',
  'business_management',
].join(',');
