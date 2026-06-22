import { getAnalyticsConfig, hasAnalyticsConfig } from './config';
import { getAnalyticsConsent } from './consent';

export type AnalyticsEventParams = Record<string, string | number | boolean | undefined>;

let analyticsReady = false;

export function markAnalyticsReady(): void {
  analyticsReady = true;
}

export function isAnalyticsActive(): boolean {
  const config = getAnalyticsConfig();
  if (!hasAnalyticsConfig(config)) return false;
  if (config.debug) return analyticsReady;
  return analyticsReady && getAnalyticsConsent() === 'accepted';
}

function pushDataLayer(payload: Record<string, unknown>): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}

/** SPA page view — works with GTM dataLayer and direct GA4 gtag. */
export function trackPageView(path: string, title?: string): void {
  if (!isAnalyticsActive()) return;

  const pageTitle = title ?? document.title;
  const config = getAnalyticsConfig();

  pushDataLayer({
    event: 'page_view',
    page_path: path,
    page_title: pageTitle,
    page_location: window.location.href,
  });

  if (config.ga4Id && !config.gtmId && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: pageTitle,
      page_location: window.location.href,
    });
  }

  if (window.fbq) {
    window.fbq('track', 'PageView');
  }
}

/** Custom marketing / product events. */
export function trackEvent(name: string, params: AnalyticsEventParams = {}): void {
  if (!isAnalyticsActive()) return;

  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined)
  ) as Record<string, string | number | boolean>;

  const config = getAnalyticsConfig();

  pushDataLayer({
    event: name,
    ...cleanParams,
  });

  if (config.ga4Id && !config.gtmId && window.gtag) {
    window.gtag('event', name, cleanParams);
  }

  if (window.fbq) {
    if (name === 'signup_complete') {
      window.fbq('track', 'CompleteRegistration', cleanParams);
    } else if (name === 'login_complete') {
      window.fbq('track', 'Lead', { ...cleanParams, content_name: 'login' });
    } else if (name === 'cta_click' && cleanParams.source === 'pricing') {
      window.fbq('track', 'InitiateCheckout', cleanParams);
    } else if (name === 'signup_started') {
      window.fbq('track', 'Lead', cleanParams);
    } else {
      window.fbq('trackCustom', name, cleanParams);
    }
  }
}
