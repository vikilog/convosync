import { useMemo, useState } from 'react'
import { Cloud, Search } from 'lucide-react'

import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { MediaCard } from '@/components/media/MediaCard'
import { formatBytes } from '@/components/media/media-visual'
import { UploadMediaSheet, reportUploadError } from '@/components/media/UploadMediaSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { ApiError } from '@/lib/httpClient'
import { realMediaGalleryService, type NewMediaInput } from '@/services/realMediaGallery.service'

function reportError(err: unknown, fallback: string) {
  window.alert(err instanceof ApiError ? err.message : fallback)
}

export function MediaGalleryPage() {
  const confirm = useConfirm()
  const { data: assets = [] } = realMediaGalleryService.useList()
  const { data: usage } = realMediaGalleryService.useUsage()
  const createAssetMutation = realMediaGalleryService.useCreate()
  const updateAsset = realMediaGalleryService.useUpdate()
  const removeAsset = realMediaGalleryService.useRemove()
  const getSignedUrl = realMediaGalleryService.useSignedUrl()

  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return assets
    return assets.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.filename.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    )
  }, [assets, query])

  const usedBytes = usage?.usedBytes ?? 0
  const limitBytes = usage?.limitBytes ?? null
  const storagePct = limitBytes ? Math.min(100, Math.round((usedBytes / limitBytes) * 100)) : 0

  const toggleActive = (id: string, isActive: boolean) =>
    updateAsset.mutate(
      { id, patch: { isActive: !isActive } },
      { onError: (err) => reportError(err, 'Could not update this file.') }
    )

  const deleteAsset = async (id: string, title: string) => {
    const ok = await confirm({
      title: `Delete "${title}"?`,
      description: "This can't be undone.",
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (ok) removeAsset.mutate(id, { onError: (err) => reportError(err, 'Could not delete this file.') })
  }

  const copyLink = (id: string) => {
    getSignedUrl.mutate(id, {
      onSuccess: (res) => {
        void navigator.clipboard?.writeText(res.url)
      },
      onError: (err) => reportError(err, 'Could not create a shareable link for this file.'),
    })
  }

  const uploadAsset = (input: NewMediaInput, onDone: (ok: boolean, error?: string) => void) => {
    createAssetMutation.mutate(input, {
      onSuccess: () => onDone(true),
      onError: (err) => onDone(false, reportUploadError(err)),
    })
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <div className="shrink-0 space-y-3 border-b p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, tag, or filename"
              className="pl-8"
            />
          </div>

          <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
            {query.trim()
              ? `${filtered.length} of ${assets.length}`
              : `${assets.length} item${assets.length === 1 ? '' : 's'}`}
          </span>

          {limitBytes ? (
            <div className="w-44 shrink-0 space-y-1">
              <div className="text-muted-foreground flex items-center justify-between text-[11px]">
                <span>
                  {formatBytes(usedBytes)} of {formatBytes(limitBytes)} used
                </span>
                <span className="font-mono tabular-nums">{storagePct < 1 ? '<1' : storagePct}%</span>
              </div>
              <Progress value={storagePct} className="h-1.5" />
            </div>
          ) : null}

          <UploadMediaSheet onUpload={uploadAsset} pending={createAssetMutation.isPending} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {filtered.length === 0 ? (
          <EmptyState hasQuery={query.trim().length > 0} onClear={() => setQuery('')} />
        ) : (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))' }}
          >
            {filtered.map((asset) => (
              <MediaCard
                key={asset.id}
                asset={asset}
                onToggleActive={() => toggleActive(asset.id, asset.isActive)}
                onDelete={() => void deleteAsset(asset.id, asset.title)}
                onCopyLink={() => copyLink(asset.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ hasQuery, onClear }: { hasQuery: boolean; onClear: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-12 text-center">
      <div className="bg-primary/10 flex size-12 items-center justify-center rounded-full">
        <Cloud className="text-primary size-6" />
      </div>
      {hasQuery ? (
        <>
          <p className="text-sm font-medium">No matches</p>
          <p className="text-muted-foreground max-w-xs text-xs">Try another title, tag, or filename.</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={onClear}>
            Clear search
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm font-medium">No media yet</p>
          <p className="text-muted-foreground max-w-xs text-xs">
            Upload images, PDFs, or documents for agents and campaigns to reuse.
          </p>
        </>
      )}
    </div>
  )
}
