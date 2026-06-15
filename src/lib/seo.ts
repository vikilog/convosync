import { settingsSectionFromPath, tabFromPath, type AppTab } from '../routes';
import { SETTINGS_SECTION_TITLES } from '../components/settings/settingsNav';

import { PRODUCT_NAME } from '../landing/brand';

export const SITE_NAME = PRODUCT_NAME;
export const SITE_DESCRIPTION =
  'ConvoSync unifies WhatsApp, Instagram, email, and more into one AI-powered inbox for growing teams.';

export type PageSeo = {
  title: string;
  description: string;
  /** Path only, e.g. /dashboard */
  path: string;
  robots?: string;
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
    description: 'Manage Facebook Page posts, comments, and page insights from WaBiz.',
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
    description: 'Connect CRM, spreadsheets, LMS, and webhooks to WaBiz.',
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

export function seoForPath(
  pathname: string,
  options?: { managerOnboarding?: boolean }
): PageSeo {
  if (pathname === '/' || pathname === '') {
    return {
      title: 'WhatsApp Business for teams',
      description:
        'WaBiz — shared inbox, AI agents, campaigns, and multi-channel messaging for growing businesses.',
      path: '/',
      robots: 'index, follow',
    };
  }

  if (pathname === '/login' || pathname.startsWith('/login')) {
    return {
      title: 'Sign in',
      description: 'Sign in to your WaBiz workspace to manage WhatsApp Business.',
      path: '/login',
      robots: PRIVATE_ROBOTS,
    };
  }

  if (pathname === '/signup' || pathname.startsWith('/signup')) {
    return {
      title: 'Start free trial',
      description: 'Create your WaBiz account and start your 14-day free trial. No credit card required.',
      path: '/signup',
      robots: PRIVATE_ROBOTS,
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
      description: `Manage ${sectionLabel.toLowerCase()} for your WaBiz workspace.`,
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
  const fullTitle = formatDocumentTitle(seo.title);
  document.title = fullTitle;

  const baseUrl = (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '') ?? '';
  const canonical = baseUrl ? `${baseUrl}${seo.path}` : '';

  upsertMeta('meta[name="description"]', 'name', 'description', seo.description);
  upsertMeta('meta[name="robots"]', 'name', 'robots', seo.robots ?? PRIVATE_ROBOTS);
  upsertMeta('meta[name="application-name"]', 'name', 'application-name', SITE_NAME);

  upsertMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
  upsertMeta('meta[property="og:description"]', 'property', 'og:description', seo.description);
  upsertMeta('meta[property="og:site_name"]', 'property', 'og:site_name', SITE_NAME);
  upsertMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
  if (canonical) {
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
    upsertLink('canonical', canonical);
  }

  upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary');
  upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
  upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', seo.description);
}
