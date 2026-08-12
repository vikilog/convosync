/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, CheckCheck, Loader2, PauseCircle, X } from 'lucide-react';
import type { ChatMessage } from '../../types';
import { formatMessageClock } from '../../lib/formatDates';
import { ResendButton } from '../shared/ResendButton';
import { MessageAttachment } from './MessageAttachment';

const WA_CHAT_BG = '#e5ddd5';
const EASE = [0.22, 1, 0.36, 1] as const;

type Channel = 'whatsapp' | 'instagram' | 'messenger' | 'email';

export type AutomationWaitingBanner = {
  automationLabel: string;
  journeyName: string;
  /** ASK_QUESTION → waiting on reply; WAIT → delay pause */
  kind: 'reply' | 'delay' | 'other';
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
};

const WA_DELETED_MESSAGE = 'This message was deleted';

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
      messageType === 'location');
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
          ? 'bg-white rounded-2xl rounded-tl-md border border-black/5 shadow-sm'
          : 'bg-[#0084ff] rounded-2xl rounded-tr-md shadow-sm'
        : isContact
          ? 'bg-white rounded-2xl rounded-tl-md border border-black/5 shadow-sm'
          : 'bg-gradient-to-br from-[#833AB4]/95 to-[#E1306C] rounded-2xl rounded-tr-md shadow-sm';

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
          <MessageAttachment message={message} />
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

  return (
    <motion.div
      {...motionProps}
      className={`flex flex-col max-w-[min(72%,420px)] ${
        isContact ? 'items-start text-left' : 'items-end ml-auto text-right'
      } ${message.status === 'sending' ? 'opacity-90' : ''}`}
    >
      <div
        className={`relative p-3.5 shadow-sm border font-medium text-sm leading-relaxed whitespace-pre-wrap break-words rounded-2xl ${
          isContact
            ? 'bg-white border-black/5 text-gray-900 rounded-tl-md'
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
          : message.content === '[media]'
            ? 'Media'
            : message.content}
      </div>
      <div className="flex items-center gap-1 mt-1 text-meta text-gray-400 font-bold font-mono px-1">
        <span>{time}</span>
        {!isContact &&
          (message.status === 'sending' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : message.status === 'failed' ? (
            <span title={message.deliveryError || 'Delivery failed'}>
              <X className="w-3.5 h-3.5 text-red-500" />
            </span>
          ) : message.status === 'read' ? (
            <CheckCheck
              className={`w-3.5 h-3.5 ${
                channel === 'instagram' ? 'text-sky-500' : 'text-accent-green'
              }`}
            />
          ) : message.status === 'delivered' ? (
            <CheckCheck className="w-3.5 h-3.5 text-gray-400" />
          ) : (
            <Check className="w-3.5 h-3.5 text-gray-400" />
          ))}
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
    banner.kind === 'reply'
      ? `${banner.automationLabel} "${banner.journeyName}" is waiting on this reply`
      : banner.kind === 'delay'
        ? `${banner.automationLabel} "${banner.journeyName}" is paused on a wait step`
        : `${banner.automationLabel} "${banner.journeyName}" is waiting`;

  return (
    <div
      role="status"
      className="mx-auto my-3 flex max-w-md items-start gap-2.5 rounded-2xl border border-[#f2994a]/30 bg-[#fff5e6]/90 px-3.5 py-2.5 text-left shadow-sm ring-1 ring-[#f2994a]/10"
    >
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#fff5e6] text-[#b45309] ring-1 ring-[#f2994a]/25">
        <PauseCircle className="h-3.5 w-3.5" aria-hidden />
      </span>
      <p className="min-w-0 text-xs font-semibold leading-snug text-[#92400e]">{copy}</p>
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
}) => {
  const isWhatsApp = channel === 'whatsapp';
  const reduceMotion = useReducedMotion();

  if (loading) {
    return <InboxMessageListSkeleton channel={channel} />;
  }

  if (messages.length === 0) {
    return (
      <div
        className="flex-1 overflow-y-auto p-4"
        style={isWhatsApp ? { backgroundColor: WA_CHAT_BG } : undefined}
      >
        <p className="text-center text-xs text-gray-400 font-bold py-8">
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
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
        transition={{ duration: reduceMotion ? 0 : 0.2, ease: EASE }}
        className={`flex-1 overflow-y-auto px-3 py-3 space-y-1 ${isWhatsApp ? '' : 'p-4 space-y-3'}`}
        style={isWhatsApp ? { backgroundColor: WA_CHAT_BG } : undefined}
      >
        {messages.map((group) => (
          <div key={group.dateKey} className={isWhatsApp ? 'space-y-1.5' : 'space-y-3'}>
            <div className="flex justify-center select-none py-2">
              <span
                className={
                  isWhatsApp
                    ? 'px-2.5 py-1 bg-[#ffffffd9] rounded-md text-meta font-medium text-[#54656f] shadow-sm'
                    : 'px-3 py-1 bg-surface/90 ring-1 ring-black/5 rounded-full text-meta font-bold text-gray-500 tracking-wide'
                }
              >
                {group.label}
              </span>
            </div>

            {group.messages.map((message) => {
              if (message.sender === 'system') {
                return (
                  <div key={message.id} className="flex justify-center py-1">
                    <div className="bg-[#ffffffd9] text-[#54656f] rounded-lg px-3 py-1.5 text-meta font-medium max-w-[90%] text-center shadow-sm">
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
