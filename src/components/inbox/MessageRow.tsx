import { MousePointerClick, RotateCcw } from 'lucide-react'

import { FlowResponseCard, isFlowResponseMetadata } from '@/components/inbox/FlowResponseCard'
import { MessageAttachment } from '@/components/inbox/MessageAttachment'
import { MessageTicks } from '@/components/inbox/MessageTicks'
import { TemplateMessageBubble } from '@/components/inbox/TemplateMessageBubble'
import { CHANNEL_BUBBLE_CLASS, CHANNEL_BUBBLE_MUTED_CLASS } from '@/components/channel-icon'
import { emailBodyText, messageClicked, messageDeliveryError, messageEmailFields } from '@/lib/inboxMessage'
import { formatBubbleTime } from '@/lib/inboxTime'
import { isDeletedMessage, isRichMediaType, messageMediaFromMetadata } from '@/lib/messageMedia'
import { emailHtmlFragment, sanitizeEmailHtml } from '@/lib/sanitizeEmailHtml'
import { RESENDABLE_MESSAGE_STATUSES, type Conversation, type ConversationMessage } from '@/services/realInbox.service'

export function MessageRow({
  message,
  channel,
  resending,
  onResend,
}: {
  message: ConversationMessage
  channel: Conversation['channel']
  resending: boolean
  onResend: () => void
}) {
  const fromContact = message.sender === 'contact'
  const resendable = !fromContact && RESENDABLE_MESSAGE_STATUSES.includes(message.status)
  const deleted = isDeletedMessage(message)
  const media = messageMediaFromMetadata(message.metadata)
  const rich =
    !deleted &&
    (isRichMediaType(message.type) || Boolean(media)) &&
    message.type !== 'template' &&
    !isFlowResponseMetadata(message.metadata)
  const deliveryError = message.deliveryError || messageDeliveryError(message.metadata)
  const clicked = message.clicked || messageClicked(message.metadata)
  const email = messageEmailFields(message.metadata)

  if (deleted) {
    return (
      <div className={`flex ${fromContact ? 'justify-start' : 'justify-end'}`}>
        <p className="text-muted-foreground px-1.5 py-1 text-sm italic">This message was deleted</p>
      </div>
    )
  }

  if (message.type === 'template' && channel !== 'email') {
    return (
      <div className="flex flex-col items-end gap-1">
        <TemplateMessageBubble message={message} channel={channel} />
        <FailedBits
          show={resendable}
          deliveryError={deliveryError}
          onResend={onResend}
          pending={resending}
        />
      </div>
    )
  }

  if (isFlowResponseMetadata(message.metadata)) {
    return (
      <div className="flex flex-col items-start gap-1">
        <FlowResponseCard message={message} />
      </div>
    )
  }

  const hideText =
    rich &&
    (!message.content || message.content === '[media]' || message.content === 'Media unavailable')

  const emailHtml = email.html?.trim() ? sanitizeEmailHtml(emailHtmlFragment(email.html)) : ''
  const isEmail = channel === 'email'
  const body = isEmail ? emailBodyText(message.content, email.subject) : message.content

  return (
    <div
      className={`flex flex-col gap-1 ${fromContact ? 'items-start' : 'items-end'} ${
        message.status === 'sending' ? 'opacity-90' : ''
      }`}
    >
      <div
        className={`max-w-[45%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          fromContact ? 'bg-card rounded-tl-md border' : `${CHANNEL_BUBBLE_CLASS[channel]} rounded-tr-md`
        }`}
      >
        {isEmail && email.subject ? (
          <p className={`mb-1 text-xs font-semibold ${fromContact ? '' : 'text-white/90'}`}>
            {email.subject}
          </p>
        ) : null}
        {isEmail && emailHtml ? (
          <div
            className={`email-bubble max-w-full overflow-x-auto text-left text-sm ${
              fromContact ? '' : '[&_*]:text-inherit'
            }`}
            dangerouslySetInnerHTML={{ __html: emailHtml }}
          />
        ) : (
          <>
            {rich ? <MessageAttachment message={message} /> : null}
            {!hideText && body ? (
              <p className={`break-words whitespace-pre-wrap ${rich ? 'mt-1.5' : ''}`}>{body}</p>
            ) : null}
          </>
        )}
        <span
          className={`mt-1 flex items-center justify-end gap-0.5 text-[10px] whitespace-nowrap ${
            fromContact ? 'text-muted-foreground' : CHANNEL_BUBBLE_MUTED_CLASS[channel]
          }`}
        >
          {formatBubbleTime(message.createdAt)}
          {!fromContact ? <MessageTicks status={message.status} readClassName="text-white" /> : null}
        </span>
      </div>
      {!fromContact && clicked ? (
        <span className="inline-flex items-center gap-0.5 rounded-full border border-violet-100 bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-violet-700 uppercase">
          <MousePointerClick className="size-3" />
          Clicked
        </span>
      ) : null}
      <FailedBits show={resendable} deliveryError={deliveryError} onResend={onResend} pending={resending} />
    </div>
  )
}

function FailedBits({
  show,
  deliveryError,
  onResend,
  pending,
}: {
  show: boolean
  deliveryError?: string
  onResend: () => void
  pending: boolean
}) {
  if (!show && !deliveryError) return null
  return (
    <div className="text-destructive max-w-[45%] space-y-0.5 text-xs">
      {deliveryError ? <p className="leading-tight">{deliveryError}</p> : null}
      {show ? (
        <div className="flex items-center gap-1.5">
          <span>Not delivered</span>
          <button
            type="button"
            onClick={onResend}
            disabled={pending}
            className="inline-flex items-center gap-1 font-medium hover:underline disabled:opacity-50"
          >
            <RotateCcw className="size-3" />
            Resend
          </button>
        </div>
      ) : null}
    </div>
  )
}
