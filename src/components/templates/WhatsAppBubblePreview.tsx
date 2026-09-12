import { FileText, Image as ImageIcon, Video } from 'lucide-react'
import type { HeaderFormat } from '@/lib/templatesMockData'

const CHAT_BG_STYLE: React.CSSProperties = {
  backgroundColor: '#efeae2',
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d9d0c3' fill-opacity='0.35'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
}

function renderBodyWithSamples(body: string, samples: string[]): string {
  return body.replace(/\{\{(\d+)\}\}/g, (full, n: string) => {
    const idx = parseInt(n, 10) - 1
    const sample = samples[idx]?.trim()
    return sample || full
  })
}

export function WhatsAppBubblePreview({
  headerFormat,
  header,
  headerMediaUrl,
  headerMediaFileName,
  body,
  footer,
  variableSamples,
  buttonText,
}: {
  headerFormat: HeaderFormat
  header: string
  headerMediaUrl?: string
  headerMediaFileName?: string
  body: string
  footer: string
  variableSamples: string[]
  buttonText: string
}) {
  const bodyRendered = renderBodyWithSamples(body || 'Your message will appear here.', variableSamples)
  const showTextHeader = headerFormat === 'text' && header.trim()
  const showMediaHeader = headerFormat === 'image' || headerFormat === 'video' || headerFormat === 'document'

  return (
    <div className="overflow-hidden rounded-lg" style={CHAT_BG_STYLE}>
      <div className="space-y-1.5 px-2 py-2">
        <div className="flex justify-center">
          <span className="rounded-md bg-white/90 px-2 py-0.5 text-[10px] text-[#54656f]">Today</span>
        </div>
        <div className="flex justify-start">
          <div className="max-w-[95%] overflow-hidden rounded-lg rounded-tl-sm border bg-white text-[#111b21]">
            {showMediaHeader ? (
              <div className="border-b bg-[#f0f2f5]">
                {headerFormat === 'image' && headerMediaUrl ? (
                  <img src={headerMediaUrl} alt="" className="max-h-40 w-full object-cover" />
                ) : headerFormat === 'video' && headerMediaUrl ? (
                  <video src={headerMediaUrl} className="max-h-40 w-full object-cover" muted />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 px-3 py-5 text-[#667781]">
                    {headerFormat === 'video' ? (
                      <Video className="size-7 opacity-60" />
                    ) : headerFormat === 'document' ? (
                      <FileText className="size-7 opacity-60" />
                    ) : (
                      <ImageIcon className="size-7 opacity-60" />
                    )}
                    <p className="max-w-full truncate text-xs">
                      {headerMediaFileName ||
                        (headerFormat === 'video'
                          ? 'Video header'
                          : headerFormat === 'document'
                            ? 'Document header'
                            : 'Image header')}
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            {showTextHeader ? (
              <p className="px-3.5 pt-3 text-sm leading-snug font-semibold">{header}</p>
            ) : null}

            <p className="line-clamp-6 px-3.5 py-2.5 text-xs leading-[1.4] break-words whitespace-pre-wrap">
              {bodyRendered}
            </p>

            {footer.trim() ? <p className="px-3.5 pb-2 text-[11px] text-[#667781]">{footer}</p> : null}

            <div className="flex justify-end px-3.5 pb-2">
              <span className="text-[10px] text-[#667781]">12:00</span>
            </div>

            {buttonText.trim() ? (
              <div className="border-t">
                <button
                  type="button"
                  tabIndex={-1}
                  className="flex w-full items-center justify-center gap-2 py-2.5 text-xs font-medium text-[#008069]"
                >
                  {buttonText}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
