export type HeaderFormat = 'none' | 'text' | 'image' | 'video' | 'document';

export type ButtonKind = 'none' | 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';

export function headerFormatToApi(format: HeaderFormat): 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | null {
  if (format === 'text') return 'TEXT';
  if (format === 'image') return 'IMAGE';
  if (format === 'video') return 'VIDEO';
  if (format === 'document') return 'DOCUMENT';
  return null;
}

export function headerFormatFromApi(format?: string | null, hasTextHeader?: boolean): HeaderFormat {
  const f = (format || '').toUpperCase();
  if (f === 'IMAGE') return 'image';
  if (f === 'VIDEO') return 'video';
  if (f === 'DOCUMENT') return 'document';
  if (f === 'TEXT' || hasTextHeader) return 'text';
  return 'none';
}

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

export const HEADER_MEDIA_ACCEPT: Record<Exclude<HeaderFormat, 'none' | 'text'>, string> = {
  image: 'image/jpeg,image/png',
  video: 'video/mp4',
  document: 'application/pdf',
};

export const HEADER_MEDIA_HINT: Record<Exclude<HeaderFormat, 'none' | 'text'>, string> = {
  image: 'JPEG or PNG, max 5 MB',
  video: 'MP4, max 16 MB',
  document: 'PDF, max 100 MB',
};
