import { useEffect, useRef, useState } from 'react'
import { MessageSquare, Paperclip, Plus, Smile, Trash2, X } from 'lucide-react'

import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useBlobUrl } from '@/hooks/useBlobUrl'
import { realCannedResponsesService, type CannedResponse } from '@/services/realCannedResponses.service'

const NEW_ID = '__new__'
const CONTENT_MAX = 1024
const SHORTCUT_MAX = 150
const MEDIA_ACCEPT = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt'
const QUICK_EMOJIS = ['👋', '🙂', '🙏', '✅', '❤️', '👍', '🎉', '📦', '⏰', '💬']

export function CannedResponsesPanel() {
  const { data: items = [], isLoading } = realCannedResponsesService.useList()
  const createMutation = realCannedResponsesService.useCreate()
  const updateMutation = realCannedResponsesService.useUpdate()
  const removeMutation = realCannedResponsesService.useRemove()
  const confirm = useConfirm()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [title, setTitle] = useState('')
  const [shortcut, setShortcut] = useState('')
  const [content, setContent] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [removeMedia, setRemoveMedia] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [localPreview, setLocalPreview] = useState('')
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const selected = selectedId === NEW_ID ? null : (items.find((i) => i.id === selectedId) ?? null)
  const isNew = selectedId === NEW_ID
  const hasExistingMedia = Boolean(selected?.mediaStorageKey) && !removeMedia
  const remotePreview = useBlobUrl(
    !mediaFile && hasExistingMedia && selected ? selected.id : null,
    realCannedResponsesService.fetchMedia
  )
  const previewUrl = localPreview || remotePreview

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview)
    }
  }, [localPreview])

  useEffect(() => {
    if (isNew) return
    setTitle(selected?.title ?? '')
    setShortcut(selected?.shortcut ?? '')
    setContent(selected?.content ?? '')
    setMediaFile(null)
    setRemoveMedia(false)
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return ''
    })
  }, [selected, isNew])

  useEffect(() => {
    if (!showEmoji) return
    const onDoc = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [showEmoji])

  const filtered = items.filter((i) => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return (
      i.title.toLowerCase().includes(q) ||
      (i.shortcut ?? '').toLowerCase().includes(q) ||
      i.content.toLowerCase().includes(q)
    )
  })

  const startNew = () => {
    setSelectedId(NEW_ID)
    setTitle('')
    setShortcut('')
    setContent('')
    setMediaFile(null)
    setRemoveMedia(false)
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return ''
    })
  }

  const insertEmoji = (emoji: string) => {
    const el = contentRef.current
    if (!el) {
      setContent((prev) => (prev + emoji).slice(0, CONTENT_MAX))
      setShowEmoji(false)
      return
    }
    const start = el.selectionStart ?? content.length
    const end = el.selectionEnd ?? content.length
    const next = (content.slice(0, start) + emoji + content.slice(end)).slice(0, CONTENT_MAX)
    setContent(next)
    setShowEmoji(false)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + emoji.length, start + emoji.length)
    })
  }

  const save = () => {
    const hasMedia = Boolean(mediaFile) || hasExistingMedia
    if (!title.trim() || (!content.trim() && !hasMedia)) return
    const patch = {
      title: title.trim(),
      content: content.slice(0, CONTENT_MAX),
      shortcut: shortcut.trim().slice(0, SHORTCUT_MAX) || null,
    }
    const media = { file: mediaFile, removeMedia }
    if (isNew) {
      createMutation.mutate({ input: patch, media }, { onSuccess: (row) => setSelectedId(row.id) })
    } else if (selected) {
      updateMutation.mutate({ id: selected.id, patch, media })
    }
  }

  const remove = async (item: CannedResponse) => {
    const ok = await confirm({
      title: `Delete "${item.title}"?`,
      description: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    removeMutation.mutate(item.id)
    if (selectedId === item.id) setSelectedId(null)
  }

  const canSave = title.trim().length > 0 && (content.trim().length > 0 || Boolean(mediaFile) || hasExistingMedia)

  return (
    <div className="flex h-full min-h-0 flex-1">
      <div className="flex w-72 shrink-0 flex-col border-r">
        <div className="shrink-0 space-y-2 border-b p-3">
          <Button size="sm" className="w-full" onClick={startNew}>
            <Plus />
            Add canned response
          </Button>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, shortcut, or content…"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`hover:bg-muted/60 flex w-full items-center justify-between gap-2 border-b px-3 py-2.5 text-left text-sm ${
                  selectedId === item.id ? 'bg-muted' : ''
                }`}
              >
                <span className="min-w-0 truncate">{item.title}</span>
                <span className="text-muted-foreground flex shrink-0 items-center gap-1 font-mono text-xs">
                  {item.mediaStorageKey ? <Paperclip className="size-3" /> : null}
                  {item.shortcut}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {!selectedId ? (
          <EmptyState
            icon={MessageSquare}
            title="No canned response selected"
            description="Pick one from the list or create a new one."
            className="h-full rounded-none border-none"
          />
        ) : (
          <div className="max-w-xl space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cr-title">Title</Label>
              <Input id="cr-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cr-shortcut">Shortcut (optional, {shortcut.length}/{SHORTCUT_MAX})</Label>
              <Input
                id="cr-shortcut"
                value={shortcut}
                maxLength={SHORTCUT_MAX}
                onChange={(e) => setShortcut(e.target.value)}
                placeholder="e.g. /hours"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="cr-content">Content ({content.length}/{CONTENT_MAX})</Label>
                <div className="relative" ref={emojiRef}>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => setShowEmoji((v) => !v)}>
                    <Smile />
                  </Button>
                  {showEmoji ? (
                    <div className="bg-popover absolute right-0 z-10 mt-1 grid grid-cols-5 gap-1 rounded-lg border p-2 shadow-md">
                      {QUICK_EMOJIS.map((e) => (
                        <button
                          key={e}
                          type="button"
                          className="hover:bg-muted rounded p-1 text-lg"
                          onClick={() => insertEmoji(e)}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <Textarea
                id="cr-content"
                ref={contentRef}
                value={content}
                maxLength={CONTENT_MAX}
                onChange={(e) => setContent(e.target.value.slice(0, CONTENT_MAX))}
                rows={8}
                placeholder="Use {{contact.name}}, {{contact.phone}} in Inbox."
              />
            </div>
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept={MEDIA_ACCEPT}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setMediaFile(file)
                    setRemoveMedia(false)
                    setLocalPreview((prev) => {
                      if (prev) URL.revokeObjectURL(prev)
                      return URL.createObjectURL(file)
                    })
                  }
                  e.target.value = ''
                }}
              />
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Paperclip />
                  Attach media
                </Button>
                {previewUrl || mediaFile || hasExistingMedia ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setMediaFile(null)
                      setLocalPreview((prev) => {
                        if (prev) URL.revokeObjectURL(prev)
                        return ''
                      })
                      if (selected?.mediaStorageKey) setRemoveMedia(true)
                    }}
                  >
                    <X />
                  </Button>
                ) : null}
              </div>
              {previewUrl && (mediaFile?.type.startsWith('image/') || selected?.mediaMimeType?.startsWith('image/')) ? (
                <img src={previewUrl} alt="" className="max-h-32 rounded-md border" />
              ) : mediaFile || hasExistingMedia ? (
                <p className="text-muted-foreground text-xs">
                  {mediaFile?.name || selected?.mediaFileName || 'Attached file'}
                </p>
              ) : null}
            </div>
            <div className="flex items-center justify-between">
              <Button
                disabled={!canSave || createMutation.isPending || updateMutation.isPending}
                onClick={save}
              >
                {isNew ? 'Create' : 'Save'}
              </Button>
              {!isNew && selected ? (
                <Button variant="ghost" size="icon-sm" onClick={() => void remove(selected)}>
                  <Trash2 />
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
