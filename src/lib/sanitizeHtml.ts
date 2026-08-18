import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML before it's passed to dangerouslySetInnerHTML. Strips
 * <script>, event-handler attributes (onerror, onclick, ...), and
 * javascript:/data:text-html URIs while keeping normal formatting markup
 * (tables, links, images, inline styles) — the shape real email HTML needs.
 */
export function sanitizeEmailHtml(html: string): string {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}
