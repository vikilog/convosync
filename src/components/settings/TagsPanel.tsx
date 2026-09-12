import { useState } from 'react'
import { ChevronDown, ChevronRight, Loader2, Pencil, Plus, Tag as TagIcon, Trash2 } from 'lucide-react'

import { CreateTagSheet } from '@/components/settings/CreateTagSheet'
import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ApiError } from '@/lib/httpClient'
import { groupTagsByFolder } from '@/lib/tagFolders'
import { workspaceTagsService, type WorkspaceTagRecord } from '@/services/workspaceTags.service'

export function TagsPanel() {
  const { data: tags = [], isLoading } = workspaceTagsService.useList()
  const removeTag = workspaceTagsService.useRemove()
  const confirm = useConfirm()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<WorkspaceTagRecord | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const groups = groupTagsByFolder(tags)
  const folders = [...new Set(tags.map((t) => t.folder).filter((f): f is string => Boolean(f)))].sort()

  const openCreate = () => {
    setEditingTag(null)
    setModalOpen(true)
  }

  const handleDelete = async (tag: WorkspaceTagRecord) => {
    const ok = await confirm({
      title: `Remove "${tag.name}"?`,
      description:
        'Contacts that already have this tag keep it — this only removes it from pickers.',
      confirmLabel: 'Remove',
      destructive: true,
    })
    if (!ok) return
    setError(null)
    removeTag.mutate(tag.id, {
      onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not delete tag'),
    })
  }

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-12 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading tags…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Tags contacts can be labeled with — used across Contacts, Journeys, and AgentFlow.
        </p>
        {tags.length > 0 ? (
          <Button size="sm" onClick={openCreate}>
            <Plus />
            New tag
          </Button>
        ) : null}
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {tags.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <TagIcon className="text-muted-foreground size-8" />
            <p className="text-sm font-medium">No tags yet</p>
            <Button size="sm" onClick={openCreate}>
              <Plus />
              New tag
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const isCollapsed = collapsed.has(group.folder)
            return (
              <Card key={group.folder}>
                <button
                  type="button"
                  className="flex w-full items-center gap-1.5 px-4 py-2.5 text-left text-sm font-medium"
                  onClick={() =>
                    setCollapsed((prev) => {
                      const next = new Set(prev)
                      if (next.has(group.folder)) next.delete(group.folder)
                      else next.add(group.folder)
                      return next
                    })
                  }
                >
                  {isCollapsed ? (
                    <ChevronRight className="text-muted-foreground size-4" />
                  ) : (
                    <ChevronDown className="text-muted-foreground size-4" />
                  )}
                  {group.folder}
                  <span className="text-muted-foreground font-normal">({group.items.length})</span>
                </button>
                {!isCollapsed ? (
                  <CardContent className="divide-y pt-0">
                    {group.items.map((tag) => (
                      <div key={tag.id} className="flex items-center justify-between gap-2 py-2">
                        <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 text-xs font-medium">
                          {tag.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Edit ${tag.name}`}
                            onClick={() => {
                              setEditingTag(tag)
                              setModalOpen(true)
                            }}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-destructive"
                            aria-label={`Delete ${tag.name}`}
                            onClick={() => void handleDelete(tag)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                ) : null}
              </Card>
            )
          })}
        </div>
      )}

      <CreateTagSheet
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingTag={editingTag}
        folders={folders}
      />
    </div>
  )
}
