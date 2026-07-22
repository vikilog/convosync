/** Analytics IDs from env — set in Vercel for production. */

export type AnalyticsConfig = {
  gtmId: string | null;
  ga4Id: string | null;
  metaPixelId: string | null;
  clarityProjectId: string | null;
  debug: boolean;
};

function readId(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getAnalyticsConfig(): AnalyticsConfig {
  return {
    gtmId: readId(import.meta.env.VITE_GTM_ID as string | undefined),
    ga4Id: readId(import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined),
    metaPixelId: readId(import.meta.env.VITE_META_PIXEL_ID as string | undefined),
    clarityProjectId: readId(import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined),
    debug: import.meta.env.VITE_ANALYTICS_DEBUG === 'true',
  };
}

export function hasAnalyticsConfig(config = getAnalyticsConfig()): boolean {
  return Boolean(config.gtmId || config.ga4Id || config.metaPixelId || config.clarityProjectId);
}

export const PUBLIC_MARKETING_PATHS = ['/signup', '/login'] as const;

export function isPublicMarketingPath(pathname: string): boolean {
  return (PUBLIC_MARKETING_PATHS as readonly string[]).includes(pathname);
}
