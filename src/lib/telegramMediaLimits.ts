/** Telegram's own limits (not ours) — sendPhoto caps stricter than sendVideo/Document/Audio.
 * Mirrors backend/src/services/telegramConnect.ts so oversized files are rejected before upload. */
const TELEGRAM_PHOTO_MAX_BYTES = 10 * 1024 * 1024;
const TELEGRAM_FILE_MAX_BYTES = 50 * 1024 * 1024;

/** Returns an error message if `file` exceeds Telegram's size limit for its kind, else null. */
export function telegramFileSizeError(file: File): string | null {
  const isImage = file.type.startsWith('image/');
  const max = isImage ? TELEGRAM_PHOTO_MAX_BYTES : TELEGRAM_FILE_MAX_BYTES;
  if (file.size <= max) return null;
  const maxMb = (max / (1024 * 1024)).toFixed(0);
  const actualMb = (file.size / (1024 * 1024)).toFixed(1);
  const hint = isImage
    ? 'Send it as a document instead, or compress the image.'
    : 'Try compressing it first.';
  return `${file.name || 'This file'} is ${actualMb}MB — Telegram limits ${
    isImage ? 'photos' : 'files'
  } to ${maxMb}MB. ${hint}`;
}
