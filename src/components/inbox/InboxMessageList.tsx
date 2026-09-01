/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useLayoutEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, CheckCheck, ClipboardCheck, Loader2, MousePointerClick, PauseCircle, X } from 'lucide-react';
import type { ChatMessage } from '../../types';
import { formatMessageClock } from '../../lib/formatDates';
import { sanitizeEmailHtml } from '../../lib/sanitizeHtml';
import { api } from '../../lib/api';
import { ResendButton } from '../shared/ResendButton';
import { MessageAttachment } from './MessageAttachment';
import { CarouselAttachment } from './CarouselAttachment';
import { WhatsAppTemplateMessageBubble } from '../templates/WhatsAppTemplatePreview';
import { headerFormatFromApi, type ButtonKind } from '../templates/templateBuilderUtils';

const WA_CHAT_BG = '#e5ddd5';
const EASE = [0.22, 1, 0.36, 1] as const;

type Channel = 'whatsapp' | 'instagram' | 'messenger' | 'email';

export type AutomationWaitingBanner = {
  automationLabel: string;
  journeyName: string;
  /** ASK_QUESTION → waiting on reply; WAIT → delay pause; paused → contact-level kill switch is on */
  kind: 'reply' | 'delay' | 'other' | 'paused';
};

type Props = {
  messages: Array<{ dateKey: string; label: string; messages: ChatMessage[] }>;
  channel: Channel;
  /** Remount key for conversation-switch entrance */
  conversationId?: string;
  messageEndRef: React.RefObject<HTMLDivElement | null>;
  loading?: boolean;
  resendingId?: string | null;
  onResend?: (messageId: string) => void;
  automationWaiting?: AutomationWaitingBanner | null;
  hasMoreOlder?: boolean;
  loadingOlder?: boolean;
  onLoadOlder?: () => void;
};

const WA_DELETED_MESSAGE = 'This message was deleted';

/** Inner body for bubble — strip outer html/body chrome from full email documents. */
function emailHtmlFragment(html: string): string {
  const trimmed = html.trim();
  const body = trimmed.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return (body?.[1] ?? trimmed).trim();
}

export function InboxMessageListSkeleton({ channel }: { channel: Channel }) {
  const isWhatsApp = channel === 'whatsapp';
  return (
    <div
      className={`flex-1 overflow-y-auto px-3 py-3 space-y-3 ${isWhatsApp ? '' : 'p-4'}`}
      style={isWhatsApp ? { backgroundColor: WA_CHAT_BG } : undefined}
      aria-busy="true"
      aria-label="Loading messages"
    >
      <div className="flex justify-center py-2">
        <span className="h-5 w-16 rounded-md skel animate-pulse" />
      </div>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const fromContact = i % 2 === 0;
        return (
          <div
            key={i}
            className={`flex ${fromContact ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`skel animate-pulse rounded-lg ${
                fromContact ? 'rounded-tl-none' : 'rounded-tr-none'
              }`}
              style={{
                width: `${42 + (i % 3) * 14}%`,
                height: i % 3 === 1 ? 56 : 36,
                maxWidth: 280,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function humanizeFieldName(name: string): string {
  const spaced = name.replace(/_/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function channelAccentBar(channel: Channel): string {
  if (channel === 'instagram') {
    return 'bg-gradient-to-b from-[#833AB4] via-[#C13584] to-[#E1306C]';
  }
  if (channel === 'messenger') return 'bg-[#0084ff]';
  if (channel === 'email') return 'bg-emerald-800';
  return 'bg-[#25D366]';
}

const MessageBubble: React.FC<{
  message: ChatMessage;
  channel: Channel;
  resending?: boolean;
  onResend?: (messageId: string) => void;
  reduceMotion: boolean | null;
}> = ({ message, channel, resending, onResend, reduceMotion }) => {
  const isContact = message.sender === 'contact';
  const isWhatsApp = channel === 'whatsapp';
  const isInstagram = channel === 'instagram';
  const time = formatMessageClock(message.createdAt);
  const isDeleted =
    message.revoked || message.content === WA_DELETED_MESSAGE;

  const isJourneyMessage = message.senderName === 'Journey' && !isContact;
  const messageType = message.type ?? 'text';
  const hasMediaAttachment =
    !isDeleted &&
    messageType !== 'text' &&
    messageType !== 'template' &&
    (Boolean(message.media?.storageKey) ||
      Boolean(message.media?.mediaUrl) ||
      Boolean(message.localPreviewUrl) ||
      message.media?.latitude != null ||
      messageType === 'image' ||
      messageType === 'video' ||
      messageType === 'audio' ||
      messageType === 'document' ||
      messageType === 'sticker' ||
      messageType === 'location' ||
      messageType === 'carousel');
  const isRichMessage = hasMediaAttachment;

  const deliveryStatusIcon = !isContact ? (
    message.status === 'sending' ? (
      <Loader2 className="w-[14px] h-[14px] animate-spin" strokeWidth={2.5} />
    ) : message.status === 'failed' ? (
      <span title={message.deliveryError || 'Delivery failed'}>
        <X className="w-[14px] h-[14px] text-red-500" strokeWidth={2.5} />
      </span>
    ) : message.status === 'resend_pending' ? (
      <Loader2 className="w-[14px] h-[14px] animate-spin text-amber-500" strokeWidth={2.5} />
    ) : message.status === 'read' ? (
      <CheckCheck
        className={`w-[14px] h-[14px] ${
          isWhatsApp ? 'text-[#99d9ff]' : isInstagram ? 'text-[#7dd3fc]' : 'text-sky-200'
        }`}
        strokeWidth={2.5}
      />
    ) : message.status === 'delivered' ? (
      <CheckCheck
        className={`w-[14px] h-[14px] ${isWhatsApp ? '' : 'text-white/90'}`}
        strokeWidth={2.5}
      />
    ) : (
      <Check
        className={`w-[14px] h-[14px] ${isWhatsApp ? '' : 'text-white/90'}`}
        strokeWidth={2.5}
      />
    )
  ) : null;

  const isEmailTemplateBubble =
    channel === 'email' &&
    !isDeleted &&
    (messageType === 'template' || Boolean(message.templateName) || Boolean(message.templateId));

  const emailBodyText = (() => {
    if (!message.emailSubject) return message.content;
    const subject = message.emailSubject.trim();
    const body = message.content.trim();
    if (!body || body === subject) return '';
    // Older sends stored `${subject}\n\n${body}` in content — strip subject prefix.
    if (body.startsWith(`${subject}\n\n`)) return body.slice(subject.length + 2).trim();
    return body;
  })();

  const emailHtml = message.emailHtml?.trim()
    ? sanitizeEmailHtml(emailHtmlFragment(message.emailHtml))
    : '';

  const renderEmailTemplateBody = (opts: { onDark: boolean }) => (
    <div className="text-left space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
            opts.onDark
              ? 'bg-white/15 text-white/90'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
          }`}
        >
          Template
        </span>
        {message.templateName ? (
          <span
            className={`text-[11px] font-semibold truncate max-w-[220px] ${
              opts.onDark ? 'text-white/80' : 'text-swiss-muted'
            }`}
          >
            {message.templateName}
          </span>
        ) : null}
      </div>
      {message.emailSubject ? (
        <p
          className={`text-sm font-bold leading-snug break-words ${
            opts.onDark ? 'text-white' : 'text-swiss-ink'
          }`}
        >
          {message.emailSubject}
        </p>
      ) : null}
      {emailHtml ? (
        // Sanitized via sanitizeEmailHtml above — inbound email ingestion
        // isn't wired yet, but this only stays self-XSS-only by that
        // accident of scope, not by any check in this component.
        <div className="rounded-lg bg-white text-swiss-ink overflow-hidden max-h-[420px] overflow-y-auto">
          <div
            className="email-inbox-html p-2 text-left text-[13px] leading-relaxed [&_*]:max-w-full [&_a]:text-emerald-700 [&_a]:underline [&_img]:max-w-full [&_img]:h-auto [&_table]:w-full [&_td]:align-top"
            dangerouslySetInnerHTML={{ __html: emailHtml }}
          />
        </div>
      ) : emailBodyText ? (
        <p
          className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
            opts.onDark ? 'text-white/90' : 'text-swiss-ink'
          }`}
        >
          {emailBodyText}
        </p>
      ) : null}
    </div>
  );

  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.22, ease: EASE },
      };

  if (isRichMessage) {
    const bubbleBase = isWhatsApp
      ? 'shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ' +
        (isContact
          ? 'bg-white rounded-lg rounded-tl-none'
          : 'bg-[#d9fdd3] rounded-lg rounded-tr-none')
      : channel === 'messenger'
        ? isContact
          ? 'bg-white rounded-2xl rounded-tl-md border border-swiss-line '
          : 'bg-[#0084ff] rounded-2xl rounded-tr-md '
        : isContact
          ? 'bg-white rounded-2xl rounded-tl-md border border-swiss-line '
          : 'bg-gradient-to-br from-[#833AB4]/95 to-[#E1306C] rounded-2xl rounded-tr-md ';

    return (
      <motion.div
        {...motionProps}
        className={`flex flex-col max-w-[min(72%,420px)] w-fit ${
          isContact ? 'items-start mr-auto' : 'items-end ml-auto'
        } ${message.status === 'sending' ? 'opacity-90' : ''}`}
      >
        <div className={`relative overflow-hidden ${bubbleBase} p-1`}>
          {!isWhatsApp && !isContact && (
            <span
              className={`absolute left-0 top-0 bottom-0 w-0.5 ${channelAccentBar(channel)} opacity-80`}
              aria-hidden
            />
          )}
          {messageType === 'carousel' ? (
            <CarouselAttachment message={message} />
          ) : (
            <MessageAttachment message={message} />
          )}
          <span className="absolute bottom-1.5 right-1.5 z-10 flex items-center gap-0.5 rounded-md bg-black/50 px-1.5 py-0.5 text-xs text-white leading-none">
            {time}
            {deliveryStatusIcon}
          </span>
        </div>
        {isJourneyMessage && (
          <p className="text-xs text-[#667781] font-medium mt-1 leading-tight px-1">
            Automated · Journey
          </p>
        )}
        {!isContact && message.status === 'failed' && (
          <>
            {message.deliveryError && (
              <p className="text-xs text-red-600 mt-1 leading-tight px-1 max-w-full">
                {message.deliveryError}
              </p>
            )}
            {onResend && (
              <ResendButton
                loading={resending}
                onClick={() => onResend(message.id)}
              />
            )}
          </>
        )}
      </motion.div>
    );
  }

  if (isWhatsApp && !isDeleted && message.flowResponseFields) {
    const entries = Object.entries(message.flowResponseFields);
    return (
      <motion.div
        {...motionProps}
        className={`flex flex-col max-w-[min(72%,420px)] w-fit ${
          isContact ? 'items-start mr-auto' : 'items-end ml-auto'
        }`}
      >
        <div className="w-full bg-white rounded-lg rounded-tl-sm shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] overflow-hidden">
          <div className="flex items-center gap-1.5 px-3.5 pt-3 pb-2 border-b border-[#e9edef]">
            <ClipboardCheck className="w-4 h-4 text-channel-green shrink-0" />
            <span className="text-sm font-bold text-[#111b21] truncate">
              {message.flowResponseName || 'Flow'} completed
            </span>
          </div>
          {entries.length > 0 && (
            <dl className="px-3.5 py-2.5 space-y-2">
              {entries.map(([key, val]) => (
                <div key={key}>
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-[#667781]">
                    {humanizeFieldName(key)}
                  </dt>
                  <dd className="text-sm text-[#111b21] break-words">{String(val)}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-meta text-swiss-faint font-bold font-mono px-1">
          <span>{time}</span>
          {deliveryStatusIcon}
        </div>
      </motion.div>
    );
  }

  if (isWhatsApp && messageType === 'template' && !isDeleted) {
    const headerFormat = headerFormatFromApi(
      message.waTemplateHeaderFormat,
      Boolean(message.waTemplateHeader)
    );
    const headerMediaPreviewUrl = message.waTemplateHeaderMediaStorageKey
      ? api.templateHeaderMediaUrl(message.waTemplateHeaderMediaStorageKey)
      : undefined;
    const buttonType = (message.waTemplateButtonType as '' | ButtonKind) || '';

    return (
      <motion.div
        {...motionProps}
        className={`flex flex-col max-w-[min(72%,420px)] w-fit ${
          isContact ? 'items-start mr-auto' : 'items-end ml-auto'
        } ${message.status === 'sending' ? 'opacity-90' : ''}`}
      >
        <WhatsAppTemplateMessageBubble
          headerFormat={headerFormat}
          header={message.waTemplateHeader || ''}
          headerMediaPreviewUrl={headerMediaPreviewUrl}
          headerMediaFileName={message.waTemplateHeaderMediaFileName}
          bodyRendered={message.content}
          footer={message.waTemplateFooter || ''}
          buttonType={buttonType}
          buttonText={message.waTemplateButtonText || ''}
          hideFooterTime
        />
        <div className="flex items-center gap-1.5 mt-1 text-meta text-swiss-faint font-bold font-mono px-1">
          <span>{time}</span>
          {deliveryStatusIcon}
        </div>
        {isJourneyMessage && (
          <p className="text-xs text-[#667781] font-medium mt-0.5 leading-tight px-1">
            Automated · Journey
          </p>
        )}
        {!isContact && message.status === 'failed' && (
          <>
            {message.deliveryError && (
              <p className="text-xs text-red-600 mt-1 leading-tight px-1 max-w-full">
                {message.deliveryError}
              </p>
            )}
            {onResend && (
              <ResendButton loading={resending} onClick={() => onResend(message.id)} />
            )}
          </>
        )}
      </motion.div>
    );
  }

  if (isWhatsApp) {
    const bubbleBase =
      'shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ' +
      (isContact
        ? 'bg-white rounded-lg rounded-tl-none'
        : 'bg-[#d9fdd3] rounded-lg rounded-tr-none');

    return (
      <motion.div
        {...motionProps}
        className={`flex flex-col max-w-[min(72%,420px)] ${
          isContact ? 'items-start mr-auto' : 'items-end ml-auto'
        }`}
      >
        <div
          className={`relative px-2.5 pt-1.5 pb-1 text-sm leading-[19px] whitespace-pre-wrap break-words ${bubbleBase}`}
        >
          <div className={`pr-14 ${isDeleted ? 'italic text-[#667781]' : 'text-[#111b21]'}`}>
            {isDeleted
              ? WA_DELETED_MESSAGE
              : message.content === '[media]'
                ? 'Media unavailable'
                : message.content}
          </div>
          {isJourneyMessage && !isDeleted && (
            <p className="text-xs text-[#667781] font-medium mt-1 leading-tight">
              Automated · Journey
            </p>
          )}
          <span className="absolute bottom-1 right-2 flex items-center gap-0.5 text-meta text-[#667781] leading-none">
            {time}
            {!isDeleted ? deliveryStatusIcon : null}
          </span>
        </div>
        {!isContact && message.status === 'failed' && (
          <>
            {message.deliveryError && (
              <p className="text-xs text-red-600 mt-1 leading-tight px-1 max-w-full">
                {message.deliveryError}
              </p>
            )}
            {onResend && (
              <ResendButton
                loading={resending}
                onClick={() => onResend(message.id)}
              />
            )}
          </>
        )}
      </motion.div>
    );
  }

  const outboundClass =
    channel === 'instagram'
      ? 'bg-gradient-to-br from-[#833AB4]/90 to-[#E1306C] border-transparent text-white'
      : channel === 'messenger'
        ? 'bg-[#0084ff] border-[#0084ff] text-white'
        : 'bg-channel-green border-channel-green text-white';

  const footerStatus =
    !isContact &&
    (message.status === 'sending' ? (
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
    ) : message.status === 'failed' ? (
      <span title={message.deliveryError || 'Delivery failed'}>
        <X className="w-3.5 h-3.5 text-red-500" />
      </span>
    ) : message.status === 'read' ? (
      <CheckCheck
        className={`w-3.5 h-3.5 ${
          channel === 'instagram' ? 'text-sky-500' : channel === 'email' ? 'text-sky-500' : 'text-accent-green'
        }`}
      />
    ) : message.status === 'delivered' ? (
      <CheckCheck className="w-3.5 h-3.5 text-swiss-faint" />
    ) : (
      <Check className="w-3.5 h-3.5 text-swiss-faint" />
    ));

  const footerClickBadge =
    !isContact && message.clicked ? (
      <span
        title="Link clicked"
        className="inline-flex items-center gap-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
      >
        <MousePointerClick className="w-3 h-3" strokeWidth={2.5} aria-hidden />
        Clicked
      </span>
    ) : null;

  return (
    <motion.div
      {...motionProps}
      className={`flex flex-col max-w-[min(72%,420px)] ${
        isContact ? 'items-start text-left' : 'items-end ml-auto text-right'
      } ${message.status === 'sending' ? 'opacity-90' : ''}`}
    >
      <div
        className={`relative p-3.5 border font-medium text-sm leading-relaxed break-words rounded-2xl ${
          isEmailTemplateBubble ? '' : 'whitespace-pre-wrap'
        } ${
          isContact
            ? 'bg-white border-swiss-line text-swiss-ink rounded-tl-md'
            : `${outboundClass} rounded-tr-md border-transparent`
        }`}
      >
        {!isContact && (
          <span
            className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full ${channelAccentBar(channel)} opacity-70`}
            aria-hidden
          />
        )}
        {isDeleted
          ? 'This message was deleted'
          : isEmailTemplateBubble
            ? renderEmailTemplateBody({ onDark: !isContact })
            : message.content === '[media]'
              ? 'Media'
              : message.content}
      </div>
      <div className="flex items-center gap-1.5 mt-1 text-meta text-swiss-faint font-bold font-mono px-1">
        <span>{time}</span>
        {footerStatus}
        {footerClickBadge}
      </div>
      {!isContact && message.status === 'failed' && (
        <>
          {message.deliveryError && (
            <p className="text-xs text-red-600 mt-0.5 leading-tight px-1">{message.deliveryError}</p>
          )}
          {onResend && (
            <ResendButton loading={resending} onClick={() => onResend(message.id)} />
          )}
        </>
      )}
    </motion.div>
  );
};

function AutomationWaitingCard({ banner }: { banner: AutomationWaitingBanner }) {
  const copy =
    banner.kind === 'paused'
      ? `${banner.automationLabel} is paused for this contact — it won't resume automatically`
      : banner.kind === 'reply'
        ? `${banner.automationLabel} "${banner.journeyName}" is waiting on this reply`
        : banner.kind === 'delay'
          ? `${banner.automationLabel} "${banner.journeyName}" is paused on a wait step`
          : `${banner.automationLabel} "${banner.journeyName}" is waiting`;

  const tone =
    banner.kind === 'paused'
      ? {
          wrap: 'border-slate-200 bg-slate-50/90 ring-slate-100',
          badge: 'bg-slate-100 text-slate-500 ring-slate-200',
          text: 'text-slate-600',
        }
      : {
          wrap: 'border-[#f2994a]/30 bg-[#fff5e6]/90 ring-[#f2994a]/10',
          badge: 'bg-[#fff5e6] text-[#b45309] ring-[#f2994a]/25',
          text: 'text-[#92400e]',
        };

  return (
    <div
      role="status"
      className={`mx-auto my-3 flex max-w-md items-start gap-2.5 rounded-2xl border px-3.5 py-2.5 text-left ring-1 ${tone.wrap}`}
    >
      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ring-1 ${tone.badge}`}>
        <PauseCircle className="h-3.5 w-3.5" aria-hidden />
      </span>
      <p className={`min-w-0 text-xs font-semibold leading-snug ${tone.text}`}>{copy}</p>
    </div>
  );
}

export const InboxMessageList: React.FC<Props> = ({
  messages,
  channel,
  conversationId,
  messageEndRef,
  loading = false,
  resendingId = null,
  onResend,
  automationWaiting = null,
  hasMoreOlder = false,
  loadingOlder = false,
  onLoadOlder,
}) => {
  const isWhatsApp = channel === 'whatsapp';
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  // Prepending older messages above the current view would otherwise yank
  // the scroll position to the top — capture the pre-prepend scrollHeight on
  // click, then shift scrollTop by the delta once the taller content lands.
  const pendingScrollAdjustRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    const prevHeight = pendingScrollAdjustRef.current;
    if (prevHeight == null || !el) return;
    pendingScrollAdjustRef.current = null;
    el.scrollTop += el.scrollHeight - prevHeight;
  }, [messages]);

  const handleLoadOlderClick = () => {
    if (!onLoadOlder || !containerRef.current) return;
    pendingScrollAdjustRef.current = containerRef.current.scrollHeight;
    onLoadOlder();
  };

  if (loading) {
    return <InboxMessageListSkeleton channel={channel} />;
  }

  if (messages.length === 0) {
    return (
      <div
        className="flex-1 overflow-y-auto p-4"
        style={isWhatsApp ? { backgroundColor: WA_CHAT_BG } : undefined}
      >
        <p className="text-center text-xs text-swiss-faint font-bold py-8">
          No messages yet. Send the first reply below.
        </p>
        {automationWaiting ? <AutomationWaitingCard banner={automationWaiting} /> : null}
        <div ref={messageEndRef} />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={conversationId || 'thread'}
        ref={containerRef}
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
        transition={{ duration: reduceMotion ? 0 : 0.2, ease: EASE }}
        className={`flex-1 overflow-y-auto px-3 py-3 space-y-1 ${isWhatsApp ? '' : 'p-4 space-y-3'}`}
        style={isWhatsApp ? { backgroundColor: WA_CHAT_BG } : undefined}
      >
        {hasMoreOlder && (
          <div className="flex justify-center pb-2">
            <button
              type="button"
              onClick={handleLoadOlderClick}
              disabled={loadingOlder}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-meta font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                isWhatsApp
                  ? 'bg-[#ffffffd9] text-[#54656f] hover:bg-white'
                  : 'bg-surface/90 text-swiss-muted ring-1 ring-black/5 hover:bg-surface'
              }`}
            >
              {loadingOlder ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {loadingOlder ? 'Loading…' : 'Load older messages'}
            </button>
          </div>
        )}
        {messages.map((group) => (
          <div key={group.dateKey} className={isWhatsApp ? 'space-y-1.5' : 'space-y-3'}>
            <div className="flex justify-center select-none py-2">
              <span
                className={
                  isWhatsApp
                    ? 'px-2.5 py-1 bg-[#ffffffd9] rounded-md text-meta font-medium text-[#54656f] '
                    : 'px-3 py-1 bg-surface/90 ring-1 ring-black/5 rounded-full text-meta font-bold text-swiss-muted tracking-wide'
                }
              >
                {group.label}
              </span>
            </div>

            {group.messages.map((message) => {
              if (message.sender === 'system') {
                return (
                  <div key={message.id} className="flex justify-center py-1">
                    <div className="bg-[#ffffffd9] text-[#54656f] rounded-lg px-3 py-1.5 text-meta font-medium max-w-[90%] text-center ">
                      {message.content}
                    </div>
                  </div>
                );
              }

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  channel={channel}
                  resending={resendingId === message.id}
                  onResend={onResend}
                  reduceMotion={reduceMotion}
                />
              );
            })}
          </div>
        ))}

        {automationWaiting ? <AutomationWaitingCard banner={automationWaiting} /> : null}
        <div ref={messageEndRef} />
      </motion.div>
    </AnimatePresence>
  );
};
