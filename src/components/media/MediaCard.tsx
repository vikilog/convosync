import { Link2, MoreHorizontal, Power, Trash2 } from 'lucide-react'

import { MediaThumbnail } from '@/components/media/MediaThumbnail'
import { MEDIA_VISUAL } from '@/components/media/media-visual'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { MediaAsset } from '@/services/realMediaGallery.service'

export function MediaCard({
  asset,
  onToggleActive,
  onDelete,
  onCopyLink,
}: {
  asset: MediaAsset
  onToggleActive: () => void
  onDelete: () => void
  onCopyLink: () => void
}) {
  const visual = MEDIA_VISUAL[asset.type]
  const Icon = visual.icon
  const metaTag = asset.tags[0] ?? asset.usage[0] ?? asset.scope

  return (
    <div className="group bg-card relative flex flex-col overflow-hidden rounded-xl border">
      <div className={`relative flex aspect-[4/3] flex-col items-center justify-center gap-1.5 ${visual.bg}`}>
        {asset.type === 'image' ? <MediaThumbnail mediaId={asset.id} alt={asset.title} /> : null}
        <Icon className={`size-7 ${visual.text}`} />
        <span className={`text-[10px] font-semibold tracking-wide uppercase ${visual.text}`}>
          {asset.type}
        </span>

        <Badge variant={asset.isActive ? 'default' : 'secondary'} className="absolute top-2 left-2 shadow-sm">
          {asset.isActive ? 'Active' : 'Off'}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon-sm"
              className="absolute top-2 right-2 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              aria-label="Media actions"
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onCopyLink}>
              <Link2 />
              Copy link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleActive}>
              <Power />
              {asset.isActive ? 'Deactivate' : 'Activate'}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-1 flex-col gap-1 px-3 py-2.5">
        <h3 className="truncate text-sm font-semibold">{asset.title}</h3>
        {asset.description ? (
          <p className="text-muted-foreground line-clamp-1 text-xs">{asset.description}</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <p className="text-muted-foreground truncate text-[11px]" title={asset.filename}>
            {asset.filename}
          </p>
          <Badge variant="outline" className="shrink-0 capitalize">
            {metaTag}
          </Badge>
        </div>
      </div>
    </div>
  )
}
