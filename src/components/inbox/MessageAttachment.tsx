/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, FileText, Loader2, MapPin, X } from 'lucide-react';
import type { ChatMessage } from '../../types';
import { api } from '../../lib/api';

type Props = {
  message: ChatMessage;
};

/** Fixed frame so skeleton → media doesn't jump (WhatsApp-style). */
const MEDIA_FRAME =
  'relative w-[min(280px,72vw)] aspect-[4/3] overflow-hidden rounded-md bg-[#ece5dd]';

function MediaSkeleton({ className = MEDIA_FRAME }: { className?: string }) {
  return (
    <div className={`${className} animate-pulse`} aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-br from-[#d1d7db]/90 via-[#c4ccd2]/70 to-[#d1d7db]/90" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full bg-white/40" />
      </div>
    </div>
  );
}

function SendingClockOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/25 pointer-events-none">
      <div className="flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 text-white">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span className="text-meta font-semibold">Sending…</span>
      </div>
    </div>
  );
}

function downloadFromUrl(url: string, fileName: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function MediaPreviewModal({
  url,
  type,
  fileName,
  caption,
  onClose,
}: {
  url: string;
  type: 'image' | 'sticker' | 'video';
  fileName: string;
  caption?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label="Media preview"
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-white/90 font-medium truncate min-w-0">
          {caption || fileName}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => downloadFromUrl(url, fileName)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 hover:bg-white/25 px-3 py-2 text-sm font-bold text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors"
            aria-label="Close preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        className="flex-1 flex items-center justify-center p-4 min-h-0"
        onClick={onClose}
      >
        <div
          className="max-w-full max-h-full"
          onClick={(e) => e.stopPropagation()}
        >
          {type === 'video' ? (
            <video
              src={url}
              controls
              autoPlay
              className="max-w-[min(960px,94vw)] max-h-[min(80vh,900px)] rounded-lg bg-black"
            />
          ) : (
            <img
              src={url}
              alt={caption || fileName}
              className="max-w-[min(960px,94vw)] max-h-[min(80vh,900px)] rounded-lg object-contain"
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function MessageAttachment({ message }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const type = message.type ?? 'text';
  const media = message.media;
  const hasFile = Boolean(media?.storageKey);
  const isSending = message.status === 'sending';
  const localPreviewUrl = message.localPreviewUrl;
  const isMediaType =
    type === 'image' ||
    type === 'video' ||
    type === 'audio' ||
    type === 'document' ||
    type === 'sticker' ||
    type === 'location';

  useEffect(() => {
    if (localPreviewUrl || !hasFile || type === 'location') {
      setLoading(false);
      return;
    }
    let active = true;
    let objectUrl: string | null = null;

    setLoading(true);
    setError(false);

    void api
      .fetchMessageAttachment(message.id)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [hasFile, localPreviewUrl, message.id, type]);

  const previewUrl = localPreviewUrl || blobUrl;
  const showSkeleton = !previewUrl && loading;

  if (type === 'location' && media?.latitude != null && media?.longitude != null) {
    const label = media.locationName || media.locationAddress || 'Shared location';
    const mapsUrl = `https://www.google.com/maps?q=${media.latitude},${media.longitude}`;
    return (
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-2 rounded-lg border border-[#d1d7db] bg-[#f0f2f5] px-3 py-2 text-[#111b21] hover:bg-[#e9edef] transition-colors"
      >
        <MapPin className="w-4 h-4 shrink-0 text-[#128C7E] mt-0.5" />
        <span className="text-sm leading-snug">
          <span className="font-semibold block">{label}</span>
          <span className="text-meta text-[#667781]">Open in Maps</span>
        </span>
      </a>
    );
  }

  if (!hasFile && !localPreviewUrl) {
    if (isMediaType) {
      return (
        <p className="text-sm text-[#667781] italic px-1.5 py-2">
          {message.content === '[media]' || message.content === 'Media unavailable'
            ? 'Media unavailable'
            : message.content}
        </p>
      );
    }
    return null;
  }

  if (showSkeleton) {
    if (type === 'audio') {
      return (
        <div className="min-w-[220px] h-10 rounded-full bg-[#d1d7db]/70 animate-pulse" />
      );
    }
    if (type === 'document') {
      return (
        <div className="flex items-center gap-2 min-w-[200px] rounded-lg border border-[#E5E7EB] bg-[#f0f2f5] px-3 py-2.5 animate-pulse">
          <div className="h-4 w-4 rounded bg-[#d1d7db]" />
          <div className="h-3 flex-1 rounded bg-[#d1d7db]" />
        </div>
      );
    }
    return <MediaSkeleton />;
  }

  if (!previewUrl && (error || !blobUrl)) {
    return <p className="text-sm text-[#667781] px-1.5 py-2">{message.content}</p>;
  }

  const caption = media?.caption?.trim();
  const fileName = media?.fileName || 'attachment';
  const canPreview =
    Boolean(previewUrl) &&
    !isSending &&
    (type === 'image' || type === 'sticker' || type === 'video');

  if (type === 'image' || type === 'sticker') {
    return (
      <div className="w-fit max-w-full">
        <button
          type="button"
          disabled={!canPreview}
          onClick={() => canPreview && setPreviewOpen(true)}
          className={`${MEDIA_FRAME} block text-left ${canPreview ? 'cursor-zoom-in' : 'cursor-default'}`}
        >
          <img
            src={previewUrl ?? undefined}
            alt={caption || fileName}
            className={`absolute inset-0 h-full w-full object-cover ${isSending ? 'opacity-90' : ''}`}
          />
          {isSending && <SendingClockOverlay />}
        </button>
        {caption && (
          <p className="text-sm whitespace-pre-wrap break-words px-1.5 pt-1 pb-5 text-[#111b21]">
            {caption}
          </p>
        )}
        {previewOpen && previewUrl && (
          <MediaPreviewModal
            url={previewUrl}
            type={type}
            fileName={fileName.endsWith('.jpg') || fileName.includes('.') ? fileName : `${fileName}.jpg`}
            caption={caption}
            onClose={() => setPreviewOpen(false)}
          />
        )}
      </div>
    );
  }

  if (type === 'video') {
    return (
      <div className="w-fit max-w-full">
        <button
          type="button"
          disabled={!canPreview}
          onClick={() => canPreview && setPreviewOpen(true)}
          className={`${MEDIA_FRAME} bg-black block text-left ${canPreview ? 'cursor-zoom-in' : 'cursor-default'}`}
        >
          <video
            src={previewUrl ?? undefined}
            muted
            playsInline
            preload="metadata"
            className={`absolute inset-0 h-full w-full object-contain pointer-events-none ${isSending ? 'opacity-90' : ''}`}
          />
          {!isSending && (
            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="h-12 w-12 rounded-full bg-black/50 flex items-center justify-center">
                <span className="ml-1 border-y-8 border-y-transparent border-l-[14px] border-l-white" />
              </span>
            </span>
          )}
          {isSending && <SendingClockOverlay />}
        </button>
        {caption && (
          <p className="text-sm whitespace-pre-wrap break-words px-1.5 pt-1 pb-5 text-[#111b21]">
            {caption}
          </p>
        )}
        {previewOpen && previewUrl && (
          <MediaPreviewModal
            url={previewUrl}
            type="video"
            fileName={fileName.includes('.') ? fileName : `${fileName}.mp4`}
            caption={caption}
            onClose={() => setPreviewOpen(false)}
          />
        )}
      </div>
    );
  }

  if (type === 'audio') {
    return (
      <div className="relative min-w-[220px]">
        <audio src={previewUrl ?? undefined} controls={!isSending} className="w-full h-9" />
        {isSending && (
          <div className="flex items-center gap-2 mt-1 text-meta text-[#667781] font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Sending…
          </div>
        )}
      </div>
    );
  }

  if (isSending) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[#d1d7db] bg-[#f0f2f5] px-3 py-2.5 text-[#111b21]">
        <Loader2 className="w-4 h-4 shrink-0 animate-spin text-[#128C7E]" />
        <span className="text-sm font-medium truncate flex-1">{fileName}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-[#d1d7db] bg-[#f0f2f5] px-3 py-2 text-[#111b21]">
      <FileText className="w-4 h-4 shrink-0 text-[#128C7E]" />
      <span className="text-sm font-medium truncate flex-1">{fileName}</span>
      {previewUrl && (
        <button
          type="button"
          onClick={() => downloadFromUrl(previewUrl, fileName)}
          className="inline-flex items-center gap-1 shrink-0 text-xs font-bold text-[#128C7E] hover:underline"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
      )}
    </div>
  );
}
