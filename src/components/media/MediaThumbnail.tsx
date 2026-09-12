import { useBlobUrl } from '@/hooks/useBlobUrl'
import { realMediaGalleryService } from '@/services/realMediaGallery.service'

/** Only images get a real fetched thumbnail (matches the reference app) —
 * video/audio/pdf/document cards fall back to a type icon, since previewing
 * those inline isn't worth an authenticated blob fetch per card. */
export function MediaThumbnail({ mediaId, alt }: { mediaId: string; alt: string }) {
  const src = useBlobUrl(mediaId, realMediaGalleryService.fetchImageBlob)
  if (!src) return null
  return <img src={src} alt={alt} className="absolute inset-0 size-full object-cover" />
}
