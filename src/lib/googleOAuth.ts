export const GOOGLE_OAUTH_REDIRECT_STORAGE_KEY = 'convosync_google_oauth_redirect';
export const GOOGLE_OAUTH_RETURN_PATH_KEY = 'convosync_google_oauth_return';

/** Must match a URI registered in Google Cloud Console and allowed by the API. */
export function getGoogleOAuthRedirectUri(): string {
  return `${window.location.origin}/google/callback`;
}

export function startGoogleOAuth(oauthUrl: string, redirectUri: string): void {
  sessionStorage.setItem(GOOGLE_OAUTH_REDIRECT_STORAGE_KEY, redirectUri);
  localStorage.setItem(GOOGLE_OAUTH_REDIRECT_STORAGE_KEY, redirectUri);
  window.location.href = oauthUrl;
}

export function readStoredGoogleOAuthRedirectUri(): string {
  return (
    sessionStorage.getItem(GOOGLE_OAUTH_REDIRECT_STORAGE_KEY) ||
    localStorage.getItem(GOOGLE_OAUTH_REDIRECT_STORAGE_KEY) ||
    getGoogleOAuthRedirectUri()
  );
}
