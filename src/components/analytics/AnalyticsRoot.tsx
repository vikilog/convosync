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
  trackPageView,
} from '../../lib/analytics';
import { CookieConsentBanner } from './CookieConsentBanner';

/** Boots analytics scripts, SPA page views, and cookie consent on public pages. */
export function AnalyticsRoot() {
  const { pathname } = useLocation();

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

  const showConsent = hasAnalyticsConfig() && isPublicMarketingPath(pathname);

  return showConsent ? <CookieConsentBanner /> : null;
}
