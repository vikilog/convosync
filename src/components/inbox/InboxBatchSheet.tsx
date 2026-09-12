import { useState } from 'react'
import { ListChecks, Sparkles, Tag, Workflow } from 'lucide-react'
import { toast } from 'sonner'

import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { realContactsService } from '@/services/realContacts.service'
import {
  realInboxService,
  type Conversation,
  type ConversationAssigneeType,
} from '@/services/realInbox.service'

export function InboxBatchSheet({
  open,
  onOpenChange,
  conversations,
  selectedIds,
  onClear,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversations: Conversation[]
  selectedIds: Set<string>
  onClear: () => void
}) {
  const confirm = useConfirm()
  const [busy, setBusy] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const setStatus = realInboxService.useSetStatus()
  const setAssignee = realInboxService.useSetAssignee()
  const deleteConversation = realInboxService.useDelete()
  const updateContact = realContactsService.useUpdate()
  const { data: agents = [] } = realInboxService.useAssignableAgents()
  const selected = conversations.filter((c) => selectedIds.has(c.id))
  const channel = selected[0]?.channel
  const mixedChannel = selected.some((c) => c.channel !== channel)
  const { data: automations = [] } = realInboxService.useAutomations(
    !mixedChannel && (channel === 'whatsapp' || channel === 'instagram') ? channel : 'whatsapp'
  )

  const run = async (label: string, work: () => Promise<void>) => {
    setBusy(true)
    try {
      await work()
      onClear()
      onOpenChange(false)
    } catch (err) {
      toast.error(label, { description: err instanceof Error ? err.message : 'Failed' })
    } finally {
      setBusy(false)
    }
  }

  const assignAll = (assigneeType: Exclude<ConversationAssigneeType, 'ai' | 'rule_based'>, assigneeId: string | null) =>
    run('Assign failed', async () => {
      let failed = 0
      for (const conv of selected) {
        try {
          await setAssignee.mutateAsync({ conversationId: conv.id, assigneeType, assigneeId })
        } catch {
          failed += 1
        }
      }
      if (failed) toast.error(`${failed} of ${selected.length} chats failed to update.`)
    })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ListChecks className="size-4" />
            {selectedIds.size} chat{selectedIds.size === 1 ? '' : 's'} selected
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-5 overflow-y-auto px-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() =>
                void run('Resolve failed', async () => {
                  let failed = 0
                  for (const conv of selected) {
                    try {
                      await setStatus.mutateAsync({ conversationId: conv.id, status: 'resolved' })
                    } catch {
                      failed += 1
                    }
                  }
                  if (failed) toast.error(`${failed} of ${selected.length} chats failed to resolve.`)
                })
              }
            >
              Resolve
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={busy}
              onClick={async () => {
                const ok = await confirm({
                  title: `Delete ${selected.length} conversation${selected.length === 1 ? '' : 's'}?`,
                  description: 'This removes the entire message thread. This cannot be undone.',
                  confirmLabel: 'Delete',
                  destructive: true,
                })
                if (!ok) return
                await run('Delete failed', async () => {
                  let failed = 0
                  for (const conv of selected) {
                    try {
                      await deleteConversation.mutateAsync(conv.id)
                    } catch {
                      failed += 1
                    }
                  }
                  if (failed) toast.error(`${failed} of ${selected.length} chats failed to delete.`)
                })
              }}
            >
              Delete
            </Button>
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => void assignAll(null, null)}>
              Unassign
            </Button>
          </div>

          <div>
            <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">Add tag</p>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                const tag = tagInput.trim()
                if (!tag) return
                void run('Tag failed', async () => {
                  let failed = 0
                  for (const conv of selected) {
                    try {
                      const next = conv.contact.tags.includes(tag)
                        ? conv.contact.tags
                        : [...conv.contact.tags, tag]
                      await updateContact.mutateAsync({ id: conv.contactId, patch: { tags: next } })
                    } catch {
                      failed += 1
                    }
                  }
                  setTagInput('')
                  if (failed) toast.error(`${failed} of ${selected.length} chats failed to tag.`)
                })
              }}
            >
              <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Tag name" />
              <Button type="submit" size="sm" disabled={busy || !tagInput.trim()}>
                <Tag />
                Add
              </Button>
            </form>
          </div>

          <div>
            <p className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="size-3.5" />
              Assign AI agent
            </p>
            {agents.length === 0 ? (
              <p className="text-muted-foreground text-xs">No published AI agents</p>
            ) : (
              <ul className="space-y-1">
                {agents.map((agent) => (
                  <li key={agent.id}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void assignAll('ai_agent', agent.id)}
                      className="hover:bg-muted w-full truncate rounded-lg px-3 py-2 text-left text-sm disabled:opacity-50"
                    >
                      {agent.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {!mixedChannel && (channel === 'whatsapp' || channel === 'instagram') ? (
            <div>
              <p className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                <Workflow className="size-3.5" />
                Assign automation
              </p>
              {automations.length === 0 ? (
                <p className="text-muted-foreground text-xs">No published automations</p>
              ) : (
                <ul className="space-y-1">
                  {automations.map((journey) => (
                    <li key={journey.id}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void assignAll('journey', journey.id)}
                        className="hover:bg-muted w-full truncate rounded-lg px-3 py-2 text-left text-sm disabled:opacity-50"
                      >
                        {journey.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
