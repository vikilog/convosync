/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import type { ChatMessage } from '../../types';
import { api } from '../../lib/api';

type Props = {
  message: ChatMessage;
};

function CarouselTile({
  messageId,
  index,
  localPreviewUrl,
  mimeType,
  onOpen,
}: {
  messageId: string;
  index: number;
  localPreviewUrl?: string;
  mimeType?: string;
  onOpen: () => void;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(!localPreviewUrl);

  useEffect(() => {
    if (localPreviewUrl) return;
    let active = true;
    let objectUrl: string | null = null;
    setLoading(true);
    void api
      .fetchMessageAttachment(messageId, index)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [messageId, index, localPreviewUrl]);

  const src = localPreviewUrl || blobUrl;
  const isVideo = mimeType?.startsWith('video/');

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!src}
      className="relative aspect-square overflow-hidden rounded-md bg-[#ece5dd] cursor-zoom-in disabled:cursor-default"
    >
      {loading || !src ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#d1d7db]/90 via-[#c4ccd2]/70 to-[#d1d7db]/90 animate-pulse" />
      ) : isVideo ? (
        <video src={src} muted playsInline className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
    </button>
  );
}

function CarouselLightbox({
  messageId,
  items,
  localPreviewUrls,
  startIndex,
  caption,
  onClose,
}: {
  messageId: string;
  items: { mimeType?: string }[];
  localPreviewUrls?: string[];
  startIndex: number;
  caption?: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const [urlCache, setUrlCache] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(items.length - 1, i + 1));
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      Object.values(urlCache).forEach((url) => URL.revokeObjectURL(url as string));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- revoke cache only on unmount
  }, [onClose, items.length]);

  useEffect(() => {
    if (localPreviewUrls?.[index] || urlCache[index]) return;
    let active = true;
    setLoading(true);
    void api
      .fetchMessageAttachment(messageId, index)
      .then((blob) => {
        if (!active) return;
        setUrlCache((prev) => ({ ...prev, [index]: URL.createObjectURL(blob) }));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [messageId, index, localPreviewUrls, urlCache]);

  const src = localPreviewUrls?.[index] || urlCache[index];
  const isVideo = Boolean(items[index]?.mimeType?.startsWith('video/'));

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label="Album preview"
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 shrink-0" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm text-white/90 font-medium truncate min-w-0">
          {caption || `${index + 1} / ${items.length}`}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors shrink-0"
          aria-label="Close preview"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 min-h-0 relative" onClick={onClose}>
        {index > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => Math.max(0, i - 1));
            }}
            className="absolute left-2 sm:left-6 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div className="max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
          {!src || loading ? (
            <Loader2 className="w-8 h-8 animate-spin text-white/80" />
          ) : isVideo ? (
            <video
              src={src}
              controls
              autoPlay
              className="max-w-[min(960px,94vw)] max-h-[min(80vh,900px)] rounded-lg bg-black"
            />
          ) : (
            <img
              src={src}
              alt=""
              className="max-w-[min(960px,94vw)] max-h-[min(80vh,900px)] rounded-lg object-contain"
            />
          )}
        </div>
        {index < items.length - 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => Math.min(items.length - 1, i + 1));
            }}
            className="absolute right-2 sm:right-6 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}

export function CarouselAttachment({ message }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const items = message.carouselItems ?? [];
  const isSending = message.status === 'sending';
  const caption = message.media?.caption?.trim();

  if (items.length === 0) {
    return <p className="text-sm text-[#667781] italic px-1.5 py-2">{message.content}</p>;
  }

  return (
    <div className="w-fit max-w-full">
      <div className="grid grid-cols-2 gap-1 w-[min(280px,72vw)]">
        {items.map((item, index) => (
          <CarouselTile
            key={index}
            messageId={message.id}
            index={index}
            localPreviewUrl={message.localPreviewUrls?.[index]}
            mimeType={item.mimeType}
            onOpen={() => setLightboxIndex(index)}
          />
        ))}
      </div>
      {isSending && (
        <div className="flex items-center gap-2 mt-1 text-meta text-[#667781] font-medium">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Sending album…
        </div>
      )}
      {caption && (
        <p className="text-sm whitespace-pre-wrap break-words px-1.5 pt-1 pb-5 text-[#111b21]">{caption}</p>
      )}
      {lightboxIndex !== null && (
        <CarouselLightbox
          messageId={message.id}
          items={items}
          localPreviewUrls={message.localPreviewUrls}
          startIndex={lightboxIndex}
          caption={caption}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
