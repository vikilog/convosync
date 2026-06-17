/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getAnalyticsConsent,
  getAnalyticsConfig,
  hasAnalyticsConfig,
  initAnalytics,
  isPublicMarketingPath,
  trackEvent,
  trackPageView,
} from '../../lib/analytics';
import { CookieConsentBanner } from './CookieConsentBanner';

const LANDING_SECTIONS = [
  'hero',
  'pricing',
  'features',
  'how-it-works',
  'final-cta',
] as const;

function useLandingSectionViews(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.35) continue;
          const id = entry.target.id;
          if (!id || seen.has(id)) continue;
          seen.add(id);
          trackEvent('section_view', { section_id: id });
        }
      },
      { threshold: [0.35] }
    );

    for (const id of LANDING_SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [enabled]);
}

/** Boots analytics scripts, SPA page views, and cookie consent on public pages. */
export function AnalyticsRoot() {
  const { pathname } = useLocation();
  const isLanding = pathname === '/';

  useEffect(() => {
    if (!hasAnalyticsConfig()) return;

    const config = getAnalyticsConfig();
    if (config.debug || getAnalyticsConsent() === 'accepted') {
      initAnalytics();
    }
  }, []);

  useEffect(() => {
    if (!hasAnalyticsConfig()) return;
    trackPageView(pathname, document.title);
  }, [pathname]);

  useLandingSectionViews(isLanding);

  const showConsent = hasAnalyticsConfig() && isPublicMarketingPath(pathname);

  return showConsent ? <CookieConsentBanner /> : null;
}
