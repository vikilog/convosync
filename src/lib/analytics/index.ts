export { getAnalyticsConfig, hasAnalyticsConfig, isPublicMarketingPath, PUBLIC_MARKETING_PATHS } from './config';
export { getAnalyticsConsent, setAnalyticsConsent, type AnalyticsConsent } from './consent';
export { loadAnalyticsScripts } from './loaders';
export { isAnalyticsActive, markAnalyticsReady, trackEvent, trackPageView, type AnalyticsEventParams } from './track';

import { getAnalyticsConfig, hasAnalyticsConfig } from './config';
import { getAnalyticsConsent } from './consent';
import { loadAnalyticsScripts } from './loaders';
import { markAnalyticsReady } from './track';

/** Load third-party scripts after consent (or immediately in debug mode). */
export function initAnalytics(): void {
  const config = getAnalyticsConfig();
  if (!hasAnalyticsConfig(config)) return;

  const consent = getAnalyticsConsent();
  if (!config.debug && consent !== 'accepted') return;

  loadAnalyticsScripts(config);
  markAnalyticsReady();
}
