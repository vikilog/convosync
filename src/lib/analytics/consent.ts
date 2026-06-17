const CONSENT_KEY = 'convosync_analytics_consent';

export type AnalyticsConsent = 'pending' | 'accepted' | 'declined';

export function getAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === 'undefined') return 'pending';
  const stored = localStorage.getItem(CONSENT_KEY);
  if (stored === 'accepted' || stored === 'declined') return stored;
  return 'pending';
}

export function setAnalyticsConsent(value: 'accepted' | 'declined'): void {
  localStorage.setItem(CONSENT_KEY, value);
}
