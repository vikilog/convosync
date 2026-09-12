import { useState } from 'react'
import { Cloud, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/lib/httpClient'
import type { MediaScope, NewMediaInput } from '@/services/realMediaGallery.service'

export function UploadMediaSheet({
  onUpload,
  pending,
}: {
  onUpload: (input: NewMediaInput, onDone: (ok: boolean, error?: string) => void) => void
  pending?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scope, setScope] = useState<MediaScope>('customer')
  const [tags, setTags] = useState('')
  const [usage, setUsage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setFile(null)
    setTitle('')
    setDescription('')
    setScope('customer')
    setTags('')
    setUsage('')
    setError(null)
  }

  const canSave = Boolean(file) && title.trim().length > 0 && description.trim().length > 0

  const handleSave = () => {
    if (!file) return
    setError(null)
    onUpload(
      {
        title: title.trim(),
        description: description.trim(),
        scope,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        usage: usage
          .split(',')
          .map((u) => u.trim())
          .filter(Boolean),
        file,
      },
      (ok, err) => {
        if (ok) {
          setOpen(false)
          reset()
        } else {
          setError(err ?? 'Could not upload this file.')
        }
      }
    )
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus />
        Add media
      </Button>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Upload to S3</SheetTitle>
          <p className="text-muted-foreground text-xs">
            Files are stored in your AWS bucket, then indexed for agents.
          </p>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <label className="hover:border-primary hover:bg-accent/40 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <Cloud className="text-muted-foreground size-6" />
            <p className="text-sm font-medium">{file?.name || 'Drag & drop or click to browse'}</p>
            <p className="text-muted-foreground text-[11px]">Images 5MB · Video/Audio 16MB · PDF/DOC 100MB</p>
          </label>

          <div className="space-y-1.5">
            <Label htmlFor="media-title">Title</Label>
            <Input
              id="media-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Diwali sale banner"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="media-description">Description</Label>
            <Textarea
              id="media-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this file used for?"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Scope</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as MediaScope)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="partner">Partner</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="media-usage">Usage</Label>
            <Input
              id="media-usage"
              value={usage}
              onChange={(e) => setUsage(e.target.value)}
              placeholder="e.g. agent, catalog"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="media-tags">Tags</Label>
            <Input
              id="media-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. pricing, brochure"
            />
          </div>

          {error ? <p className="text-destructive text-xs">{error}</p> : null}
        </div>

        <SheetFooter>
          <div className="flex gap-2">
            <SheetClose asChild>
              <Button variant="outline" className="flex-1">
                Cancel
              </Button>
            </SheetClose>
            <Button className="flex-1" disabled={!canSave || pending} onClick={handleSave}>
              {pending ? 'Uploading…' : 'Upload to S3'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export function reportUploadError(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Could not upload this file.'
}
