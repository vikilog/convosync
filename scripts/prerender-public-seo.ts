/**
 * Injects route-specific SEO / Open Graph meta into static HTML after Vite build.
 * Social crawlers (WhatsApp, LinkedIn, Facebook, Slack) read HTML without running JS.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_SITE_ORIGIN,
  PUBLIC_PRERENDER_PATHS,
  buildSeoHeadHtml,
  formatDocumentTitle,
  seoForPath,
} from '../src/lib/seo';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const origin = process.env.VITE_APP_URL?.replace(/\/$/, '') || DEFAULT_SITE_ORIGIN;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function injectSeo(html: string, routePath: string): string {
  const seo = seoForPath(routePath);
  const fullTitle = formatDocumentTitle(seo.title);
  const headTags = buildSeoHeadHtml(seo, origin);

  let out = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(fullTitle)}</title>`);

  const stripPatterns = [
    /<meta name="description"[^>]*>\s*/gi,
    /<meta name="robots"[^>]*>\s*/gi,
    /<meta name="application-name"[^>]*>\s*/gi,
    /<link rel="canonical"[^>]*>\s*/gi,
    /<meta property="og:[^"]+"[^>]*>\s*/gi,
    /<meta name="twitter:[^"]+"[^>]*>\s*/gi,
  ];
  for (const pattern of stripPatterns) {
    out = out.replace(pattern, '');
  }

  return out.replace('</head>', `    ${headTags}\n  </head>`);
}

function writeRouteHtml(routePath: string, html: string) {
  const injected = injectSeo(html, routePath);
  if (routePath === '/') {
    fs.writeFileSync(path.join(distDir, 'index.html'), injected, 'utf8');
    return;
  }
  const dir = path.join(distDir, routePath.slice(1));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), injected, 'utf8');
}

const baseHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

for (const routePath of PUBLIC_PRERENDER_PATHS) {
  writeRouteHtml(routePath, baseHtml);
  console.log(`[seo] prerendered ${routePath} → ${origin}${routePath}`);
}
