import { useEffect, useId, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ApiError } from '@/lib/httpClient'
import { normalizeTagFolder } from '@/lib/tagFolders'
import { workspaceTagsService, type WorkspaceTagRecord } from '@/services/workspaceTags.service'

export function CreateTagSheet({
  open,
  onOpenChange,
  editingTag,
  folders,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingTag: WorkspaceTagRecord | null
  folders: string[]
}) {
  const isEdit = Boolean(editingTag)
  const [name, setName] = useState('')
  const [folder, setFolder] = useState('')
  const [error, setError] = useState<string | null>(null)
  const folderListId = useId()
  const createTag = workspaceTagsService.useCreate()
  const updateTag = workspaceTagsService.useUpdate()
  const pending = createTag.isPending || updateTag.isPending

  useEffect(() => {
    if (!open) return
    setName(editingTag?.name ?? '')
    setFolder(editingTag?.folder ?? '')
    setError(null)
  }, [open, editingTag])

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Tag name is required.')
      return
    }
    const payload = { name: trimmed, folder: normalizeTagFolder(folder) }
    const onError = (err: unknown) =>
      setError(err instanceof ApiError ? err.message : 'Could not save tag')
    if (isEdit && editingTag) {
      updateTag.mutate(
        { id: editingTag.id, patch: payload },
        { onSuccess: () => onOpenChange(false), onError }
      )
    } else {
      createTag.mutate(payload, { onSuccess: () => onOpenChange(false), onError })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit tag' : 'New tag'}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <div className="space-y-1.5">
            <Label htmlFor="tag-name">Name</Label>
            <Input
              id="tag-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. VIP"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tag-folder">Folder</Label>
            <Input
              id="tag-folder"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              list={folderListId}
              placeholder="Tags"
            />
            <datalist id={folderListId}>
              {folders.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
            <p className="text-muted-foreground text-xs">Leave blank to file it under Uncategorized.</p>
          </div>
          {error ? <p className="text-destructive text-xs">{error}</p> : null}
        </div>
        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button variant="ghost">Cancel</Button>
          </SheetClose>
          <Button disabled={pending} onClick={submit}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
