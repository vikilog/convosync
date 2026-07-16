/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Download, FileText, Loader2, MapPin } from 'lucide-react';
import type { ChatMessage } from '../../types';
import { api } from '../../lib/api';

type Props = {
  message: ChatMessage;
};

function SendingOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/35">
      <div className="flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-white">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-meta font-semibold">Sending…</span>
      </div>
    </div>
  );
}

export function MessageAttachment({ message }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

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
    if (localPreviewUrl || !hasFile || type === 'location') return;
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
          {message.content === '[media]' ? 'Media unavailable' : message.content}
        </p>
      );
    }
    return null;
  }

  if (!localPreviewUrl && loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-[#667781]">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs font-medium">Loading…</span>
      </div>
    );
  }

  if (!localPreviewUrl && (error || !blobUrl)) {
    return (
      <p className="text-sm text-[#667781]">{message.content}</p>
    );
  }

  const caption = media?.caption?.trim();
  const fileName = media?.fileName || 'attachment';

  if (type === 'image' || type === 'sticker') {
    return (
      <div className="w-fit max-w-full">
        <div className="relative">
          <img
            src={previewUrl ?? undefined}
            alt={caption || fileName}
            className={`block max-w-[min(320px,72vw)] max-h-72 rounded-md object-cover ${isSending ? 'opacity-80' : ''}`}
          />
          {isSending && <SendingOverlay />}
        </div>
        {caption && (
          <p className="text-sm whitespace-pre-wrap break-words px-1.5 pt-1 pb-5 text-[#111b21]">
            {caption}
          </p>
        )}
      </div>
    );
  }

  if (type === 'video') {
    return (
      <div className="w-fit max-w-full">
        <div className="relative">
          <video
            src={previewUrl ?? undefined}
            controls={!isSending}
            className={`block max-w-[min(320px,72vw)] max-h-72 rounded-md bg-black ${isSending ? 'opacity-80' : ''}`}
          />
          {isSending && <SendingOverlay />}
        </div>
        {caption && (
          <p className="text-sm whitespace-pre-wrap break-words px-1.5 pt-1 pb-5 text-[#111b21]">
            {caption}
          </p>
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
    <a
      href={previewUrl ?? undefined}
      download={fileName}
      className="flex items-center gap-2 rounded-lg border border-[#d1d7db] bg-[#f0f2f5] px-3 py-2 text-[#111b21] hover:bg-[#e9edef] transition-colors"
    >
      <FileText className="w-4 h-4 shrink-0 text-[#128C7E]" />
      <span className="text-sm font-medium truncate flex-1">{fileName}</span>
      <Download className="w-3.5 h-3.5 shrink-0 text-[#667781]" />
    </a>
  );
}
