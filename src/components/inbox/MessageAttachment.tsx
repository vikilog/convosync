import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createPortal } from 'react-dom'
import { Download, FileText, MapPin, X } from 'lucide-react'

import { useObjectUrl } from '@/hooks/useBlobUrl'
import { httpClient } from '@/lib/httpClient'
import { messageMediaFromMetadata, type MessageMedia } from '@/lib/messageMedia'
import type { ConversationMessage } from '@/services/realInbox.service'

const MEDIA_FRAME = 'relative w-[min(280px,72vw)] aspect-[4/3] overflow-hidden rounded-md bg-muted'

function useAttachmentUrl(messageId: string, index?: number, media?: MessageMedia) {
  const remoteUrl = media?.mediaUrl
  const hasFile = Boolean(media?.storageKey) || index !== undefined
  const enabled = Boolean(!remoteUrl && hasFile)
  const { data: blob, isPending, isError } = useQuery({
    queryKey: ['inbox-attachment', messageId, index ?? null],
    queryFn: () =>
      httpClient.getBlob(
        index === undefined
          ? `/conversations/messages/${messageId}/attachment`
          : `/conversations/messages/${messageId}/attachment?index=${index}`,
      ),
    enabled,
    staleTime: Infinity,
  })
  const blobUrl = useObjectUrl(blob)
  return { url: remoteUrl || blobUrl || null, loading: enabled && isPending && !blob, error: isError }
}

function downloadFromUrl(url: string, fileName: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

function MediaPreviewModal({
  url,
  type,
  fileName,
  onClose,
}: {
  url: string
  type: 'image' | 'sticker' | 'video'
  fileName: string
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label="Media preview"
      onClick={onClose}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <p className="min-w-0 truncate text-sm font-medium text-white/90">{fileName}</p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => downloadFromUrl(url, fileName)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white hover:bg-white/25"
          >
            <Download className="size-4" />
            Download
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-lg bg-white/15 text-white hover:bg-white/25"
            aria-label="Close preview"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center p-4" onClick={onClose}>
        <div className="max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
          {type === 'video' ? (
            <video src={url} controls autoPlay className="max-h-[min(80vh,900px)] max-w-[min(960px,94vw)] rounded-lg bg-black" />
          ) : (
            <img src={url} alt={fileName} className="max-h-[min(80vh,900px)] max-w-[min(960px,94vw)] rounded-lg object-contain" />
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

function CarouselTile({ messageId, index }: { messageId: string; index: number }) {
  const { url, loading } = useAttachmentUrl(messageId, index, { storageKey: 'item' })
  if (loading || !url) return <div className="bg-muted size-24 shrink-0 animate-pulse rounded-md" />
  return <img src={url} alt="" className="size-24 shrink-0 rounded-md object-cover" />
}

export function MessageAttachment({ message }: { message: ConversationMessage }) {
  const type = message.type ?? 'text'
  const media = messageMediaFromMetadata(message.metadata)
  const { url, loading, error } = useAttachmentUrl(message.id, undefined, media)
  const [previewOpen, setPreviewOpen] = useState(false)
  const caption = media?.caption?.trim()
  const fileName = media?.fileName || 'attachment'

  if (type === 'location' && media?.latitude != null && media?.longitude != null) {
    const label = media.locationName || media.locationAddress || 'Shared location'
    const mapsUrl = `https://www.google.com/maps?q=${media.latitude},${media.longitude}`
    return (
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-muted/60 hover:bg-muted flex items-start gap-2 rounded-lg border px-3 py-2"
      >
        <MapPin className="text-channel-green mt-0.5 size-4 shrink-0" />
        <span className="text-sm leading-snug">
          <span className="block font-semibold">{label}</span>
          <span className="text-muted-foreground text-xs">Open in Maps</span>
        </span>
      </a>
    )
  }

  if (type === 'carousel' && (media?.items?.length ?? 0) > 0) {
    return (
      <div className="flex max-w-[min(280px,72vw)] gap-1.5 overflow-x-auto">
        {media!.items!.map((_, i) => (
          <CarouselTile key={i} messageId={message.id} index={i} />
        ))}
      </div>
    )
  }

  if (loading) {
    if (type === 'audio') return <div className="bg-muted h-10 w-[220px] animate-pulse rounded-full" />
    if (type === 'document') {
      return <div className="bg-muted h-10 w-[200px] animate-pulse rounded-lg" />
    }
    return <div className={`${MEDIA_FRAME} animate-pulse`} />
  }

  if (!url) {
    if (type === 'document') {
      return (
        <div className="bg-muted/60 flex items-start gap-2 rounded-lg border px-3 py-2">
          <FileText className="text-channel-green mt-0.5 size-4 shrink-0" />
          <span className="text-sm font-medium break-words">{fileName || message.content || 'Document'}</span>
        </div>
      )
    }
    return (
      <p className="text-muted-foreground px-1.5 py-2 text-sm italic">
        {error || message.content === '[media]' ? 'Media unavailable' : message.content}
      </p>
    )
  }

  if (type === 'image' || type === 'sticker') {
    return (
      <div className="w-fit max-w-full">
        <button type="button" onClick={() => setPreviewOpen(true)} className={`${MEDIA_FRAME} block cursor-zoom-in text-left`}>
          <img src={url} alt={caption || fileName} className="absolute inset-0 size-full object-cover" />
        </button>
        {caption ? <p className="px-1.5 pt-1 text-sm break-words whitespace-pre-wrap">{caption}</p> : null}
        {previewOpen ? (
          <MediaPreviewModal url={url} type={type} fileName={fileName} onClose={() => setPreviewOpen(false)} />
        ) : null}
      </div>
    )
  }

  if (type === 'video') {
    return (
      <div className="w-fit max-w-full">
        <video src={url} controls className="max-h-64 max-w-[min(280px,72vw)] rounded-md bg-black" />
        {caption ? <p className="px-1.5 pt-1 text-sm break-words whitespace-pre-wrap">{caption}</p> : null}
      </div>
    )
  }

  if (type === 'audio') {
    return <audio src={url} controls className="max-w-[min(280px,72vw)]" />
  }

  return (
    <a
      href={url}
      download={fileName}
      className="bg-muted/60 hover:bg-muted flex items-start gap-2 rounded-lg border px-3 py-2"
    >
      <FileText className="text-channel-green mt-0.5 size-4 shrink-0" />
      <span className="text-sm font-medium break-words">{fileName}</span>
    </a>
  )
}
