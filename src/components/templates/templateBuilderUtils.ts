export type HeaderFormat = 'none' | 'text';

export type ButtonKind = 'none' | 'QUICK_REPLY' | 'URL';

export function countBodyVariables(body: string): number {
  const found = new Set<number>();
  for (const m of body.matchAll(/\{\{(\d+)\}\}/g)) {
    found.add(parseInt(m[1], 10));
  }
  if (found.size === 0) return 0;
  return Math.max(...found);
}

export function nextVariableIndex(body: string): number {
  return countBodyVariables(body) + 1;
}

export function renderBodyWithSamples(body: string, samples: string[]): string {
  return body.replace(/\{\{(\d+)\}\}/g, (_, n) => {
    const idx = parseInt(n, 10) - 1;
    const sample = samples[idx]?.trim();
    return sample || `{{${n}}}`;
  });
}

export function sanitizeDisplayName(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export const BODY_MAX = 1024;
export const HEADER_MAX = 60;
export const FOOTER_MAX = 60;
export const BUTTON_LABEL_MAX = 25;
