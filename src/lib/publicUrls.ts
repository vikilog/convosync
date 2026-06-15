const LOCALHOST_URL = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/;

function isLocalhostUrl(url: string): boolean {
  return LOCALHOST_URL.test(url);
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

/** API base including `/api` suffix. */
export function resolveApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL
    ? trimTrailingSlash(import.meta.env.VITE_API_URL)
    : undefined;

  if (typeof window === 'undefined') {
    return envUrl || 'http://localhost:4000/api';
  }

  if (import.meta.env.DEV && envUrl) {
    return envUrl;
  }

  if (envUrl && !isLocalhostUrl(envUrl)) {
    return envUrl;
  }

  return `${window.location.origin}/api`;
}

/** Socket.io origin (no `/api` suffix). */
export function resolveSocketUrl(): string {
  const envUrl = import.meta.env.VITE_SOCKET_URL
    ? trimTrailingSlash(import.meta.env.VITE_SOCKET_URL)
    : undefined;

  if (typeof window === 'undefined') {
    return envUrl || 'http://localhost:4000';
  }

  if (import.meta.env.DEV && envUrl) {
    return envUrl;
  }

  if (envUrl && !isLocalhostUrl(envUrl)) {
    return envUrl;
  }

  return window.location.origin;
}

/** Public app URL for SEO/canonical links. */
export function resolveAppUrl(): string {
  const envUrl = import.meta.env.VITE_APP_URL
    ? trimTrailingSlash(import.meta.env.VITE_APP_URL)
    : undefined;

  if (typeof window === 'undefined') {
    return envUrl || '';
  }

  if (import.meta.env.DEV && envUrl) {
    return envUrl;
  }

  if (envUrl && !isLocalhostUrl(envUrl)) {
    return envUrl;
  }

  return window.location.origin;
}
