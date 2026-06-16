import { settingsSectionFromPath, tabFromPath, type AppTab } from '../routes';
import { SETTINGS_SECTION_TITLES } from '../components/settings/settingsNav';
import { PRODUCT_DOMAIN, PRODUCT_NAME } from '../landing/brand';

export const SITE_NAME = PRODUCT_NAME;
export const SITE_DESCRIPTION =
  'ConvoSync unifies WhatsApp, Instagram, email, and AI agents into one workspace — inbox, campaigns, journeys, WhatsApp Pay, and Meta Ads for growing teams.';

export const SEO_IMAGE_PATH = '/seo.png';
export const SEO_IMAGE_WIDTH = 1731;
export const SEO_IMAGE_HEIGHT = 909;
export const DEFAULT_SITE_ORIGIN = `https://${PRODUCT_DOMAIN}`;

/** Public routes that get static HTML meta at build time for link-preview crawlers. */
export const PUBLIC_PRERENDER_PATHS = ['/', '/privacy', '/terms', '/signup', '/login'] as const;

export type PageSeo = {
  title: string;
  description: string;
  /** Path only, e.g. /dashboard */
  path: string;
  robots?: string;
  imagePath?: string;
};

export type ResolvedSeoMeta = {
  fullTitle: string;
  description: string;
  robots: string;
  canonical: string;
  imageUrl: string;
  imageAlt: string;
  siteName: string;
};

const PRIVATE_ROBOTS = 'noindex, nofollow';

const TAB_SEO: Record<AppTab, Omit<PageSeo, 'path'>> = {
  dashboard: {
    title: 'Dashboard',
    description: 'Workspace KPIs, recent campaigns, and WhatsApp performance at a glance.',
  },
  manager: {
    title: 'WhatsApp accounts',
    description: 'Connect WhatsApp Business API or Business App coexistence with Meta.',
  },
  inbox: {
    title: 'Inbox',
    description: 'Multi-agent WhatsApp inbox with assignments, tags, and AI assist.',
  },
  contacts: {
    title: 'Contacts',
    description: 'Contact directory, segments, tags, and custom attributes.',
  },
  calling: {
    title: 'Calling',
    description: 'WhatsApp voice calls and call logs linked to conversations.',
  },
  campaigns: {
    title: 'Campaigns',
    description: 'Broadcast campaigns with approved templates and variable mapping.',
  },
  templates: {
    title: 'Message templates',
    description: 'Create, preview, and submit WhatsApp message templates for Meta review.',
  },
  journey: {
    title: 'Journeys',
    description: 'Visual automation flows for onboarding and customer lifecycle.',
  },
  'ai-agent': {
    title: 'AI agents',
    description: 'Configure autonomous WhatsApp bots with knowledge and handoff rules.',
  },
  ctwa: {
    title: 'Click-to-WhatsApp ads',
    description: 'Track ad clicks, conversations, and conversions from Meta ads.',
  },
  facebook: {
    title: 'Facebook Pages',
    description: 'Manage Facebook Page posts, comments, and page insights from ConvoSync.',
  },
  pay: {
    title: 'WhatsApp Pay',
    description: 'Payment requests, settlements, and invoice status in chat.',
  },
  shop: {
    title: 'Shop catalog',
    description: 'Product catalog for interactive shopping in WhatsApp.',
  },
  integrations: {
    title: 'Integrations',
    description: 'Connect CRM, spreadsheets, LMS, and webhooks to ConvoSync.',
  },
  'google-tools': {
    title: 'Google Tools',
    description: 'Manage connected Google Calendar, Gmail, Drive, and other workspace tools.',
  },
  developers: {
    title: 'Developers',
    description: 'API keys, webhooks, and integration documentation.',
  },
  reports: {
    title: 'Reports',
    description: 'Agent performance, CSAT, and conversation analytics.',
  },
  settings: {
    title: 'Settings',
    description: 'Company profile, team, billing, and channel preferences.',
  },
};

export function getSiteOrigin(): string {
  const fromEnv = (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return DEFAULT_SITE_ORIGIN;
}

export function seoForPath(
  pathname: string,
  options?: { managerOnboarding?: boolean }
): PageSeo {
  if (pathname === '/' || pathname === '') {
    return {
      title: 'Complete Customer Ops Platform for Growing Teams',
      description: SITE_DESCRIPTION,
      path: '/',
      robots: 'index, follow',
    };
  }

  if (pathname === '/login' || pathname.startsWith('/login')) {
    return {
      title: 'Sign in',
      description: 'Sign in to your ConvoSync workspace to manage WhatsApp Business and omnichannel conversations.',
      path: '/login',
      robots: PRIVATE_ROBOTS,
    };
  }

  if (pathname === '/signup' || pathname.startsWith('/signup')) {
    return {
      title: 'Start free trial',
      description:
        'Create your ConvoSync account and start your 14-day free trial. Unified inbox, AI agents, and campaigns — no credit card required.',
      path: '/signup',
      robots: PRIVATE_ROBOTS,
    };
  }

  if (pathname === '/privacy') {
    return {
      title: 'Privacy Policy',
      description:
        'How ConvoSync collects, uses, stores, and protects personal data across WhatsApp, Instagram, email, and our AI-powered platform.',
      path: '/privacy',
      robots: 'index, follow',
    };
  }

  if (pathname === '/terms') {
    return {
      title: 'Terms of Service',
      description:
        'Terms and conditions for using ConvoSync, including subscriptions, acceptable use, messaging compliance, and integrations.',
      path: '/terms',
      robots: 'index, follow',
    };
  }

  if (pathname.startsWith('/whatsapp/callback')) {
    return {
      title: 'Connecting WhatsApp',
      description: 'Completing WhatsApp connection with Meta.',
      path: pathname,
      robots: PRIVATE_ROBOTS,
    };
  }

  if (pathname.startsWith('/facebook/callback')) {
    return {
      title: 'Connecting Facebook Page',
      description: 'Completing Facebook Page connection with Meta.',
      path: pathname,
      robots: PRIVATE_ROBOTS,
    };
  }

  if (pathname.startsWith('/meta-ads/callback')) {
    return {
      title: 'Connecting Meta Ads',
      description: 'Completing Meta Ads account connection.',
      path: pathname,
      robots: PRIVATE_ROBOTS,
    };
  }

  const tab = tabFromPath(pathname);

  if ((tab === 'manager' || tab === 'integrations') && options?.managerOnboarding) {
    return {
      title: 'Connect WhatsApp',
      description: 'Link your company WhatsApp Business number with Meta to get started.',
      path: '/integrations?channel=whatsapp',
      robots: PRIVATE_ROBOTS,
    };
  }

  if (tab === 'settings') {
    const section = settingsSectionFromPath(pathname);
    const sectionLabel = SETTINGS_SECTION_TITLES[section];
    return {
      title: `Settings — ${sectionLabel}`,
      description: `Manage ${sectionLabel.toLowerCase()} for your ConvoSync workspace.`,
      path: pathname,
      robots: PRIVATE_ROBOTS,
    };
  }

  const base = TAB_SEO[tab];
  return {
    ...base,
    path: tab === 'dashboard' && (pathname === '/' || pathname === '') ? '/dashboard' : `/${tab}`,
    robots: PRIVATE_ROBOTS,
  };
}

export function formatDocumentTitle(pageTitle: string): string {
  return `${pageTitle} · ${SITE_NAME}`;
}

export function resolveSeoMeta(seo: PageSeo, origin = getSiteOrigin()): ResolvedSeoMeta {
  const fullTitle = formatDocumentTitle(seo.title);
  const imagePath = seo.imagePath ?? SEO_IMAGE_PATH;
  return {
    fullTitle,
    description: seo.description,
    robots: seo.robots ?? PRIVATE_ROBOTS,
    canonical: `${origin}${seo.path}`,
    imageUrl: `${origin}${imagePath}`,
    imageAlt: `${SITE_NAME} — ${seo.title}`,
    siteName: SITE_NAME,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Static HTML meta block for build-time prerender (crawler-friendly link previews). */
export function buildSeoHeadHtml(seo: PageSeo, origin: string): string {
  const meta = resolveSeoMeta(seo, origin);
  return `
    <meta name="description" content="${escapeHtml(meta.description)}" />
    <meta name="robots" content="${escapeHtml(meta.robots)}" />
    <meta name="application-name" content="${escapeHtml(meta.siteName)}" />
    <link rel="canonical" href="${escapeHtml(meta.canonical)}" />
    <meta property="og:title" content="${escapeHtml(meta.fullTitle)}" />
    <meta property="og:description" content="${escapeHtml(meta.description)}" />
    <meta property="og:site_name" content="${escapeHtml(meta.siteName)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeHtml(meta.canonical)}" />
    <meta property="og:image" content="${escapeHtml(meta.imageUrl)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(meta.imageUrl)}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="${SEO_IMAGE_WIDTH}" />
    <meta property="og:image:height" content="${SEO_IMAGE_HEIGHT}" />
    <meta property="og:image:alt" content="${escapeHtml(meta.imageAlt)}" />
    <meta property="og:locale" content="en_IN" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(meta.fullTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
    <meta name="twitter:image" content="${escapeHtml(meta.imageUrl)}" />
    <meta name="twitter:image:alt" content="${escapeHtml(meta.imageAlt)}" />`.trim();
}

function upsertMeta(selector: string, attr: string, attrValue: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/** Apply title and standard SEO / Open Graph / Twitter meta tags for the current view. */
export function applyPageSeo(seo: PageSeo) {
  const meta = resolveSeoMeta(seo);
  document.title = meta.fullTitle;

  upsertMeta('meta[name="description"]', 'name', 'description', meta.description);
  upsertMeta('meta[name="robots"]', 'name', 'robots', meta.robots);
  upsertMeta('meta[name="application-name"]', 'name', 'application-name', meta.siteName);

  upsertMeta('meta[property="og:title"]', 'property', 'og:title', meta.fullTitle);
  upsertMeta('meta[property="og:description"]', 'property', 'og:description', meta.description);
  upsertMeta('meta[property="og:site_name"]', 'property', 'og:site_name', meta.siteName);
  upsertMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
  upsertMeta('meta[property="og:url"]', 'property', 'og:url', meta.canonical);
  upsertMeta('meta[property="og:image"]', 'property', 'og:image', meta.imageUrl);
  upsertMeta('meta[property="og:image:secure_url"]', 'property', 'og:image:secure_url', meta.imageUrl);
  upsertMeta('meta[property="og:image:type"]', 'property', 'og:image:type', 'image/png');
  upsertMeta('meta[property="og:image:width"]', 'property', 'og:image:width', String(SEO_IMAGE_WIDTH));
  upsertMeta('meta[property="og:image:height"]', 'property', 'og:image:height', String(SEO_IMAGE_HEIGHT));
  upsertMeta('meta[property="og:image:alt"]', 'property', 'og:image:alt', meta.imageAlt);
  upsertMeta('meta[property="og:locale"]', 'property', 'og:locale', 'en_IN');
  upsertLink('canonical', meta.canonical);

  upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
  upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', meta.fullTitle);
  upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', meta.description);
  upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', meta.imageUrl);
  upsertMeta('meta[name="twitter:image:alt"]', 'name', 'twitter:image:alt', meta.imageAlt);
}
