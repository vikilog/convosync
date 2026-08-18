/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CannedResponseRecord = {
  id: string;
  title: string;
  content: string;
  shortcut?: string | null;
  mediaMimeType?: string | null;
  mediaFileName?: string | null;
  hasMedia?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export function mapCannedResponseFromApi(raw: Record<string, unknown>): CannedResponseRecord {
  const mediaStorageKey = raw.mediaStorageKey != null ? String(raw.mediaStorageKey) : null;
  return {
    id: String(raw.id),
    title: String(raw.title ?? ''),
    content: String(raw.content ?? ''),
    shortcut: raw.shortcut != null ? String(raw.shortcut) : null,
    mediaMimeType: raw.mediaMimeType != null ? String(raw.mediaMimeType) : null,
    mediaFileName: raw.mediaFileName != null ? String(raw.mediaFileName) : null,
    hasMedia: Boolean(mediaStorageKey),
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined,
  };
}

export function applyCannedVariables(
  content: string,
  vars: Record<string, string | undefined>
): string {
  return content.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key: string) => vars[key] ?? '');
}
