import { useMemo, useState } from 'react'
import { FileText, Mail, MessageSquareText, Paperclip, Plus, Send, Sparkles, X } from 'lucide-react'

import { CHANNEL_LABEL } from '@/components/channel-icon'
import { InboxCannedPicker } from '@/components/inbox/InboxCannedPicker'
import { InboxTemplatePicker } from '@/components/inbox/InboxTemplatePicker'
import { SendMediaDialog } from '@/components/inbox/SendMediaDialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import {
  formatMessagingWindowRemaining,
  lastInboundAtFromMessages,
  messagingWindowFromLastInbound,
} from '@/lib/messagingWindow'
import { telegramFileSizeError } from '@/lib/telegramMediaLimits'
import { realCannedResponsesService } from '@/services/realCannedResponses.service'
import type { Conversation, ConversationMessage } from '@/services/realInbox.service'
import { realMediaGalleryService } from '@/services/realMediaGallery.service'

const WINDOW_BANNER = {
  whatsapp: 'bg-[#e6f7ec] text-[#006d2f] ring-[#5dfd8a]/30',
  instagram: 'bg-[#fce8f0] text-[#C13584] ring-[#E1306C]/15',
  messenger: 'bg-[#e8f4ff] text-[#1877F2] ring-[#1877F2]/15',
} as const
const QUICK_EMOJIS = ['😀', '😊', '🙏', '👍', '❤️', '🎉', '✨', '🔥']

export function InboxComposer({
  conversation,
  messages,
  sending,
  sendingTemplate,
  accountWindowLabel,
  onNewEmail,
  onSendText,
  onSendTemplate,
  onSendMedia,
  onSendCarousel,
}: {
  conversation: Conversation
  messages: ConversationMessage[]
  sending: boolean
  sendingTemplate: boolean
  accountWindowLabel?: string | null
  onNewEmail?: () => void
  onSendText: (content: string) => Promise<void>
  onSendTemplate: (
    templateId: string,
    variables: string[],
    headerMediaFile?: File | null
  ) => Promise<void>
  onSendMedia: (file: File, caption?: string) => Promise<void>
  onSendCarousel?: (files: File[], caption?: string) => Promise<void>
}) {
  const [draft, setDraft] = useState('')
  const [cannedOpen, setCannedOpen] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [mediaOpen, setMediaOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingPreview, setPendingPreview] = useState<string | null>(null)

  const channel = conversation.channel
  const isWindowChannel = channel === 'whatsapp' || channel === 'instagram' || channel === 'messenger'
  const isWhatsApp = channel === 'whatsapp'
  const isTelegram = channel === 'telegram'
  const isEmail = channel === 'email'
  const messagingWindow = useMemo(
    () => messagingWindowFromLastInbound(lastInboundAtFromMessages(messages)),
    [messages]
  )
  const windowClosed = Boolean(isWindowChannel && messagingWindow && !messagingWindow.open)
  const freeFormDisabled = windowClosed || sending

  const clearPending = () => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview)
    setPendingFile(null)
    setPendingPreview(null)
  }

  const stageFile = (file: File) => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview)
    setPendingFile(file)
    setPendingPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null)
  }

  const send = async () => {
    if (pendingFile) {
      const file = pendingFile
      const caption = draft.trim()
      setDraft('')
      clearPending()
      try {
        await onSendMedia(file, caption || undefined)
      } catch {
        setDraft(caption)
        stageFile(file)
      }
      return
    }
    const content = draft.trim()
    if (!content || freeFormDisabled) return
    setDraft('')
    try {
      await onSendText(content)
    } catch {
      setDraft(content)
    }
  }

  if (isEmail) {
    return (
      <div className="shrink-0 border-t p-3">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2.5">
          <p className="min-w-0 text-xs font-medium text-emerald-900">
            Email thread — use New Conversation to send another message.
          </p>
          <Button size="sm" onClick={onNewEmail}>
            <Mail />
            New email
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="shrink-0 border-t p-3">
      {isWindowChannel && messagingWindow ? (
        messagingWindow.open ? (
          <p className={`mb-2 rounded-xl px-3 py-2 text-xs font-medium ring-1 ${WINDOW_BANNER[channel]}`}>
            {CHANNEL_LABEL[channel]}
            {accountWindowLabel ? ` · ${accountWindowLabel}` : ''} — free-form reply window:{' '}
            {formatMessagingWindowRemaining(messagingWindow.remainingMs)}
          </p>
        ) : (
          <p className="mb-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 ring-1 ring-amber-200/80">
            {CHANNEL_LABEL[channel]} 24h reply window expired
            {accountWindowLabel ? ` (${accountWindowLabel})` : ''}.{' '}
            {isWhatsApp
              ? 'Free-form replies are off — send a template to restart the conversation.'
              : 'Customer must message again before free-form replies work.'}
          </p>
        )
      ) : null}

      {pendingFile ? (
        <div className="mb-2 flex items-center gap-2 rounded-lg border px-3 py-2">
          {pendingPreview ? (
            <img src={pendingPreview} alt="" className="size-10 rounded object-cover" />
          ) : (
            <Paperclip className="size-4 shrink-0" />
          )}
          <p className="min-w-0 flex-1 truncate text-xs font-medium">{pendingFile.name}</p>
          <Button variant="ghost" size="icon-sm" onClick={clearPending} aria-label="Remove attachment">
            <X />
          </Button>
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
      >
        <div className="bg-background focus-within:ring-ring/50 flex items-end gap-1 rounded-xl border p-1.5 focus-within:ring-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send()
              }
            }}
            placeholder={
              windowClosed
                ? isWhatsApp
                  ? '24h window closed — send a template to reopen it'
                  : '24h window closed — customer must message first'
                : pendingFile
                  ? 'Add an optional caption…'
                  : 'Type a message…'
            }
            rows={1}
            disabled={freeFormDisabled && !pendingFile}
            className="min-h-9 flex-1 resize-none border-0 shadow-none focus-visible:ring-0 disabled:opacity-60"
          />

          {windowClosed && isWhatsApp ? (
            <Button type="button" size="sm" className="mb-0.5 shrink-0" onClick={() => setTemplateOpen(true)}>
              <FileText />
              Send template
            </Button>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={windowClosed && !isWhatsApp}
                aria-label="More options"
              >
                <Plus />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                disabled={windowClosed}
                onClick={() =>
                  setDraft(
                    `Hello ${conversation.contact.name}! Thanks for reaching out. I can help with scheduling and next steps. What would you like to know first?`
                  )
                }
              >
                <Sparkles />
                AI suggest
              </DropdownMenuItem>
              <DropdownMenuItem disabled={windowClosed} onClick={() => setCannedOpen(true)}>
                <MessageSquareText />
                Canned responses
              </DropdownMenuItem>
              <DropdownMenuItem disabled={windowClosed} onClick={() => setMediaOpen(true)}>
                <Paperclip />
                Attach media
              </DropdownMenuItem>
              {isWhatsApp ? (
                <DropdownMenuItem onClick={() => setTemplateOpen(true)}>
                  <FileText />
                  Templates
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Emoji</DropdownMenuLabel>
              <div className="grid grid-cols-8 gap-0.5 px-1 pb-1">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    disabled={windowClosed}
                    onClick={() => setDraft((prev) => prev + emoji)}
                    className="hover:bg-muted h-7 w-7 rounded-md text-sm disabled:opacity-40"
                    aria-label={`Insert ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="submit"
            size="icon"
            disabled={(!draft.trim() && !pendingFile) || (freeFormDisabled && !pendingFile) || sending}
            aria-label="Send message"
          >
            <Send />
          </Button>
        </div>
      </form>

      <InboxCannedPicker
        open={cannedOpen}
        onOpenChange={setCannedOpen}
        contactName={conversation.contact.name}
        contactPhone={conversation.contact.phone}
        onInsert={(selection) => {
          setDraft(selection.message)
          if (!selection.hasMedia) return
          if (channel !== 'whatsapp' && channel !== 'instagram' && channel !== 'messenger') return
          void realCannedResponsesService
            .fetchMedia(selection.cannedId)
            .then((blob) => {
              const file = new File([blob], selection.mediaFileName || 'attachment', {
                type: blob.type || 'application/octet-stream',
              })
              stageFile(file)
            })
            .catch(() => undefined)
        }}
      />
      <InboxTemplatePicker
        open={templateOpen}
        onOpenChange={setTemplateOpen}
        sending={sendingTemplate}
        onSend={onSendTemplate}
      />
      <SendMediaDialog
        open={mediaOpen}
        onOpenChange={setMediaOpen}
        allowMultiSelect={isTelegram}
        enforceTelegramLimits={isTelegram}
        onDeviceFiles={(files) => {
          if (isTelegram && files.length > 1 && onSendCarousel) {
            void onSendCarousel(files, draft.trim() || undefined)
            return
          }
          const file = files[0]
          if (!file) return
          void onSendMedia(file, draft.trim() || undefined)
        }}
        onGalleryPick={(image) => {
          void realMediaGalleryService
            .fetchFileBlob(image.id)
            .then((blob) => {
              const file = new File([blob], image.filename || image.title, {
                type: blob.type || 'application/octet-stream',
              })
              if (isTelegram) {
                const sizeError = telegramFileSizeError(file)
                if (sizeError) throw new Error(sizeError)
              }
              return onSendMedia(file, draft.trim() || undefined)
            })
            .catch(() => undefined)
        }}
        onGalleryPickMultiple={(images) => {
          if (!onSendCarousel) return
          void Promise.all(
            images.map((img) =>
              realMediaGalleryService.fetchFileBlob(img.id).then((blob) => {
                return new File([blob], img.filename || img.title, {
                  type: blob.type || 'application/octet-stream',
                })
              })
            )
          )
            .then((files) => {
              if (isTelegram) {
                const sizeError = files.map(telegramFileSizeError).find(Boolean)
                if (sizeError) throw new Error(sizeError)
              }
              return onSendCarousel(files, draft.trim() || undefined)
            })
            .catch(() => undefined)
        }}
      />
    </div>
  )
}
