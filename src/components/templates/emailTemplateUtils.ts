// Allow dotted keys so {{contact.name}} is extracted / replaced (not left literal).
const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

export function extractEmailTemplateVariables(...parts: string[]): string[] {
  const found = new Set<string>();
  for (const part of parts) {
    if (!part) continue;
    for (const match of part.matchAll(VARIABLE_PATTERN)) {
      const key = match[1];
      if (key) found.add(key);
    }
  }
  return [...found].sort();
}

export function applyEmailTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(VARIABLE_PATTERN, (_, key: string) => variables[key] ?? `{{${key}}}`);
}

export function wrapPreviewHtml(bodyHtml: string): string {
  const trimmed = bodyHtml.trim();
  if (/<html[\s>]/i.test(trimmed)) return trimmed;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${trimmed}</body></html>`;
}

export const EMAIL_TEMPLATE_SAMPLE_VARS: Record<string, string> = {
  first_name: 'Alex',
  last_name: 'Rivera',
  company_name: 'Acme Corp',
  order_id: 'ORD-1042',
  cta_url: 'https://example.com',
};

export function buildSampleVariables(keys: string[]): Record<string, string> {
  const out: Record<string, string> = { ...EMAIL_TEMPLATE_SAMPLE_VARS };
  for (const key of keys) {
    if (!out[key]) {
      out[key] = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }
  return out;
}

/** Defaults merged with user-provided preview overrides (non-empty overrides win). */
export function mergePreviewVariables(
  keys: string[],
  overrides: Record<string, string>
): Record<string, string> {
  const merged = buildSampleVariables(keys);
  for (const key of keys) {
    const value = overrides[key];
    if (value !== undefined && value.trim() !== '') {
      merged[key] = value;
    }
  }
  return merged;
}

export function defaultEmailHtmlBody(): string {
  return `<h2 style="margin:0 0 12px;font-size:22px;color:#111827;">Hello {{first_name}},</h2>
<p style="margin:0 0 16px;line-height:1.6;color:#374151;">Thanks for choosing {{company_name}}. We're excited to have you on board.</p>
<p style="margin:0 0 20px;line-height:1.6;color:#374151;">If you have questions, just reply to this email — we're here to help.</p>
<a href="{{cta_url}}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Get started</a>`;
}

export function stripHtmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
