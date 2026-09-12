import {
  ExternalLink,
  FileText,
  Image as ImageIcon,
  LayoutTemplate,
  Phone,
  Reply,
  Video,
  Workflow,
} from 'lucide-react'

import { CHANNEL_ACCENT_BG_CLASS, CHANNEL_TEXT_CLASS, type ChannelKind } from '@/components/channel-icon'
import { MessageTicks } from '@/components/inbox/MessageTicks'
import { formatBubbleTime } from '@/lib/inboxTime'
import type { ConversationMessage, TemplateMessageMetadata } from '@/services/realInbox.service'

const HEADER_MEDIA_ICON = { IMAGE: ImageIcon, VIDEO: Video, DOCUMENT: FileText } as const

const BUTTON_ICON = { QUICK_REPLY: Reply, URL: ExternalLink, PHONE_NUMBER: Phone, FLOW: Workflow } as const

interface TemplateMessageBubbleProps {
  message: ConversationMessage
  channel: ChannelKind
}

export function TemplateMessageBubble({ message, channel }: TemplateMessageBubbleProps) {
  const meta = (message.metadata ?? {}) as Partial<TemplateMessageMetadata>
  const MediaIcon =
    meta.headerFormat && meta.headerFormat !== 'TEXT' ? HEADER_MEDIA_ICON[meta.headerFormat] : null
  const ButtonIcon = meta.buttonType ? BUTTON_ICON[meta.buttonType] : null

  const buttonHref =
    meta.buttonType === 'URL'
      ? (meta.buttonUrl ?? undefined)
      : meta.buttonType === 'PHONE_NUMBER'
        ? meta.buttonPhoneNumber
          ? `tel:${meta.buttonPhoneNumber}`
          : undefined
        : undefined

  return (
    <div className="bg-card w-full max-w-[45%] overflow-hidden rounded-2xl rounded-tr-md border">
      <div className={`h-1 w-full ${CHANNEL_ACCENT_BG_CLASS[channel]}`} />

      <div className="space-y-1.5 p-3">
        {MediaIcon ? (
          <div className="bg-muted/60 text-muted-foreground flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs">
            <MediaIcon className="size-3.5 shrink-0" />
            <span className="truncate">{meta.headerMediaFileName || `${meta.headerFormat} attachment`}</span>
          </div>
        ) : null}

        {meta.headerFormat === 'TEXT' && meta.header ? (
          <p className="text-sm font-semibold">{meta.header}</p>
        ) : null}

        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>

        {meta.footer ? <p className="text-muted-foreground text-xs">{meta.footer}</p> : null}
      </div>

      {meta.buttonType && (meta.buttonText || ButtonIcon) ? (
        buttonHref ? (
          <a
            href={buttonHref}
            target={meta.buttonType === 'URL' ? '_blank' : undefined}
            rel={meta.buttonType === 'URL' ? 'noreferrer' : undefined}
            className={`hover:bg-muted/60 flex items-center justify-center gap-1.5 border-t px-3 py-2 text-sm font-medium transition-colors ${CHANNEL_TEXT_CLASS[channel]}`}
          >
            {ButtonIcon ? <ButtonIcon className="size-3.5" /> : null}
            {meta.buttonText}
          </a>
        ) : (
          <div
            className={`flex items-center justify-center gap-1.5 border-t px-3 py-2 text-sm font-medium ${CHANNEL_TEXT_CLASS[channel]}`}
          >
            {ButtonIcon ? <ButtonIcon className="size-3.5" /> : null}
            {meta.buttonText}
          </div>
        )
      ) : null}

      <div className="text-muted-foreground flex items-center justify-end gap-1 px-3 pt-1.5 pb-2 text-[10px]">
        <LayoutTemplate className="size-3" />
        Template
        <span>· {formatBubbleTime(message.createdAt)}</span>
        <MessageTicks status={message.status} />
      </div>
    </div>
  )
}
