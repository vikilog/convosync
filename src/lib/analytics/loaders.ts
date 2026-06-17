import type { AnalyticsConfig } from './config';

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    clarity?: (...args: unknown[]) => void;
  }
}

let scriptsLoaded = false;

function injectScript(src: string, id: string): void {
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function injectInlineScript(id: string, content: string): void {
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  script.text = content;
  document.head.appendChild(script);
}

/** 1. Google Tag Manager */
function loadGtm(gtmId: string): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  injectScript(`https://www.googletagmanager.com/gtm.js?id=${gtmId}`, 'convosync-gtm');

  if (!document.getElementById('convosync-gtm-noscript')) {
    const noscript = document.createElement('noscript');
    noscript.id = 'convosync-gtm-noscript';
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';
    noscript.appendChild(iframe);
    document.body.prepend(noscript);
  }
}

/** 2. Google Analytics 4 (direct — skip when GTM handles GA4) */
function loadGa4(ga4Id: string): void {
  injectScript(`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`, 'convosync-ga4-lib');
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args as unknown as Record<string, unknown>);
  };
  window.gtag('js', new Date());
  window.gtag('config', ga4Id, { send_page_view: false });
}

/** 3. Meta Pixel */
function loadMetaPixel(pixelId: string): void {
  if (window.fbq) return;
  injectInlineScript(
    'convosync-meta-pixel',
    `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');`
  );
}

/** 4. Microsoft Clarity */
function loadClarity(projectId: string): void {
  injectInlineScript(
    'convosync-clarity',
    `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${projectId}");`
  );
}

export function loadAnalyticsScripts(config: AnalyticsConfig): void {
  if (scriptsLoaded || typeof document === 'undefined') return;
  scriptsLoaded = true;

  if (config.gtmId) {
    loadGtm(config.gtmId);
  } else if (config.ga4Id) {
    loadGa4(config.ga4Id);
  }

  if (config.metaPixelId) {
    loadMetaPixel(config.metaPixelId);
  }

  if (config.clarityProjectId) {
    loadClarity(config.clarityProjectId);
  }
}

export function resetAnalyticsScriptsForTests(): void {
  scriptsLoaded = false;
}
