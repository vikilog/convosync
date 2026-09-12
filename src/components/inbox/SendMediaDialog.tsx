import { useMemo, useRef, useState } from 'react'
import { Folder, Image as ImageIcon, Loader2, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useBlobUrl } from '@/hooks/useBlobUrl'
import { telegramFileSizeError } from '@/lib/telegramMediaLimits'
import { realMediaGalleryService, type MediaAsset } from '@/services/realMediaGallery.service'

export type PickedGalleryImage = { id: string; filename: string; title: string }

export function SendMediaDialog({
  open,
  onOpenChange,
  allowMultiSelect,
  enforceTelegramLimits,
  maxSelect = 10,
  onDeviceFiles,
  onGalleryPick,
  onGalleryPickMultiple,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  allowMultiSelect: boolean
  enforceTelegramLimits: boolean
  maxSelect?: number
  onDeviceFiles: (files: File[]) => void
  onGalleryPick: (image: PickedGalleryImage) => void
  onGalleryPickMultiple: (images: PickedGalleryImage[]) => void
}) {
  const [source, setSource] = useState<'device' | 'gallery'>('device')
  const [multiSelect, setMultiSelect] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [picking, setPicking] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: assets = [], isLoading } = realMediaGalleryService.useList()

  const images = useMemo(() => {
    const q = query.trim().toLowerCase()
    return assets.filter((a) => {
      if (a.type !== 'image' || a.isActive === false) return false
      if (!q) return true
      return a.title.toLowerCase().includes(q) || a.filename.toLowerCase().includes(q)
    })
  }, [assets, query])

  const close = () => {
    setError('')
    setMultiSelect(false)
    setSelectedIds([])
    setQuery('')
    setSource('device')
    onOpenChange(false)
  }

  const takeFiles = (fileList: FileList | null) => {
    const files: File[] = []
    if (fileList) {
      for (let i = 0; i < fileList.length && i < maxSelect; i++) {
        const f = fileList.item(i)
        if (f) files.push(f)
      }
    }
    if (files.length === 0) return
    if (enforceTelegramLimits) {
      const sizeError = files.map(telegramFileSizeError).find(Boolean)
      if (sizeError) {
        setError(sizeError)
        return
      }
    }
    onDeviceFiles(files)
    close()
  }

  const confirmGallery = (rows: MediaAsset[]) => {
    const picked = rows.map((a) => ({ id: a.id, filename: a.filename, title: a.title }))
    if (picked.length > 1) onGalleryPickMultiple(picked)
    else if (picked[0]) onGalleryPick(picked[0])
    close()
  }

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <SheetContent side="right" className="data-[side=right]:sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Send media</SheetTitle>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-3 px-4">
          <div className="bg-muted/40 grid grid-cols-2 gap-1 rounded-xl border p-1">
            <button
              type="button"
              onClick={() => {
                setSource('device')
                setError('')
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium ${
                source === 'device' ? 'bg-background shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <Folder className="size-4" />
              Device
            </button>
            <button
              type="button"
              onClick={() => {
                setSource('gallery')
                setError('')
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium ${
                source === 'gallery' ? 'bg-background shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <ImageIcon className="size-4" />
              Media Gallery
            </button>
          </div>

          {allowMultiSelect ? (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={multiSelect}
                onCheckedChange={(v) => {
                  setMultiSelect(v === true)
                  setSelectedIds([])
                }}
              />
              Select multiple (up to {maxSelect}) — sends as an album
            </label>
          ) : null}

          {error ? (
            <p className="text-destructive rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs">{error}</p>
          ) : null}

          {source === 'device' ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="hover:bg-muted/40 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-10"
            >
              <Upload className="size-6" />
              <span className="text-sm font-semibold">{multiSelect ? 'Choose files' : 'Choose a file'}</span>
              <span className="text-muted-foreground text-xs">
                {multiSelect ? `Pick 2–${maxSelect} photos or videos` : 'Click to browse your device'}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                multiple={multiSelect}
                className="hidden"
                accept={
                  multiSelect
                    ? 'image/*,video/*'
                    : 'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt'
                }
                onChange={(e) => {
                  takeFiles(e.target.files)
                  e.target.value = ''
                }}
              />
            </button>
          ) : (
            <>
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search gallery…" />
              {isLoading ? (
                <p className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
                  <Loader2 className="size-4 animate-spin" />
                  Loading gallery…
                </p>
              ) : images.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">No images in Media Gallery.</p>
              ) : (
                <ScrollArea className="min-h-0 flex-1">
                  <div className="grid grid-cols-3 gap-2 pb-2">
                    {images.map((asset) => {
                      const checked = selectedIds.includes(asset.id)
                      return (
                        <button
                          key={asset.id}
                          type="button"
                          disabled={picking}
                          onClick={() => {
                            if (multiSelect) {
                              setSelectedIds((prev) =>
                                prev.includes(asset.id)
                                  ? prev.filter((id) => id !== asset.id)
                                  : prev.length >= maxSelect
                                    ? prev
                                    : [...prev, asset.id]
                              )
                              return
                            }
                            setPicking(true)
                            confirmGallery([asset])
                            setPicking(false)
                          }}
                          className={`hover:bg-muted relative aspect-square overflow-hidden rounded-lg border text-left ${
                            checked ? 'ring-ring ring-2' : ''
                          }`}
                        >
                          <GalleryThumb mediaId={asset.id} alt={asset.title} />
                          {multiSelect ? (
                            <span className="absolute top-1 left-1">
                              <Checkbox checked={checked} />
                            </span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </>
          )}
        </div>
        {source === 'gallery' && multiSelect ? (
          <SheetFooter>
            <Button
              disabled={selectedIds.length === 0}
              onClick={() => {
                const rows = images.filter((a) => selectedIds.includes(a.id))
                confirmGallery(rows)
              }}
            >
              Send {selectedIds.length || ''} {selectedIds.length === 1 ? 'item' : 'items'}
            </Button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function GalleryThumb({ mediaId, alt }: { mediaId: string; alt: string }) {
  const src = useBlobUrl(mediaId, realMediaGalleryService.fetchImageBlob)
  if (!src) return <div className="bg-muted size-full" aria-label={alt} />
  return <img src={src} alt={alt} className="size-full object-cover" />
}
