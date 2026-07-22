/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import {
  getAnalyticsConsent,
  hasAnalyticsConfig,
  initAnalytics,
  setAnalyticsConsent,
  trackPageView,
} from '../../lib/analytics';
import { landingPath } from '../../lib/publicUrls';

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasAnalyticsConfig()) return;
    setVisible(getAnalyticsConsent() === 'pending');
  }, []);

  const accept = () => {
    setAnalyticsConsent('accepted');
    setVisible(false);
    initAnalytics();
    trackPageView(window.location.pathname, document.title);
  };

  const decline = () => {
    setAnalyticsConsent('declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 inset-x-0 z-[100] p-4 sm:p-6 pointer-events-none"
    >
      <div className="max-w-3xl mx-auto pointer-events-auto rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-md shadow-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <p className="text-sm text-gray-600 leading-relaxed flex-1">
          We use cookies and analytics (Google Analytics, Meta, Microsoft Clarity) to measure traffic and
          improve ConvoSync. See our{' '}
          <a
            href={landingPath('/privacy', '/privacy')}
            className="text-brand-indigo font-semibold hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>
          .
        </p>
        <div className="flex shrink-0 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={decline}
            className="px-4 py-2 text-sm font-semibold text-gray-600 rounded-xl border border-gray-200 hover:bg-gray-50"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={accept}
            className="px-4 py-2 text-sm font-semibold text-white rounded-full bg-channel-green hover:bg-[#20bd5a]"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
