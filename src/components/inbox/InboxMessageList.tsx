/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check, CheckCheck, Loader2 } from 'lucide-react';
import type { ChatMessage } from '../../types';
import { formatMessageClock } from '../../lib/formatDates';
import { MessageAttachment } from './MessageAttachment';

const WA_CHAT_BG = '#e5ddd5';

type Channel = 'whatsapp' | 'instagram' | 'messenger';

type Props = {
  messages: Array<{ dateKey: string; label: string; messages: ChatMessage[] }>;
  channel: Channel;
  messageEndRef: React.RefObject<HTMLDivElement | null>;
  loading?: boolean;
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

const MessageBubble: React.FC<{ message: ChatMessage; channel: Channel }> = ({
  message,
  channel,
}) => {
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
      Boolean(message.localPreviewUrl) ||
      message.media?.latitude != null ||
      // Show media bubble shell even when download failed (waMediaId present / typed media)
      messageType === 'image' ||
      messageType === 'video' ||
      messageType === 'audio' ||
      messageType === 'document' ||
      messageType === 'sticker' ||
      messageType === 'location');
  const isRichMessage = hasMediaAttachment;

  // ✓ sent · ✓✓ delivered · blue ✓✓ read (WhatsApp / Instagram / Messenger)
  const deliveryStatusIcon = !isContact ? (
    message.status === 'sending' ? (
      <Loader2 className="w-[14px] h-[14px] animate-spin" strokeWidth={2.5} />
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

  if (isRichMessage) {
    const bubbleBase = isWhatsApp
      ? 'shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ' +
        (isContact
          ? 'bg-white rounded-lg rounded-tl-none'
          : 'bg-[#d9fdd3] rounded-lg rounded-tr-none')
      : channel === 'messenger'
        ? isContact
          ? 'bg-white rounded-lg rounded-tl-none border border-slate-200/60 shadow-xs'
          : 'bg-[#0084ff] rounded-lg rounded-tr-none shadow-xs'
        : isContact
          ? 'bg-white rounded-lg rounded-tl-none border border-slate-200/60 shadow-xs'
          : 'bg-gradient-to-br from-[#833AB4] to-[#E1306C] rounded-lg rounded-tr-none shadow-xs';

    return (
      <div
        className={`flex flex-col max-w-[min(420px,78%)] w-fit ${
          isContact ? 'items-start mr-auto' : 'items-end ml-auto'
        } ${message.status === 'sending' ? 'opacity-90' : ''}`}
      >
        <div className={`relative overflow-hidden ${bubbleBase} p-1`}>
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
      </div>
    );
  }

  if (isWhatsApp) {
    const bubbleBase =
      'shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ' +
      (isContact
        ? 'bg-white rounded-lg rounded-tl-none'
        : 'bg-[#d9fdd3] rounded-lg rounded-tr-none');

    return (
      <div
        className={`flex flex-col max-w-[min(420px,78%)] ${
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
      </div>
    );
  }

  const outboundClass =
    channel === 'instagram'
      ? 'bg-gradient-to-br from-[#833AB4] to-[#E1306C] border-transparent text-white chat-bubble-out'
      : channel === 'messenger'
        ? 'bg-[#0084ff] border-[#0084ff] text-white chat-bubble-out'
        : 'bg-channel-green border-channel-green text-white chat-bubble-out';

  return (
    <div
      className={`flex flex-col max-w-[80%] ${
        isContact ? 'items-start text-left' : 'items-end ml-auto text-right'
      } ${message.status === 'sending' ? 'opacity-90' : ''}`}
    >
      <div
        className={`p-3.5 shadow-xs border relative font-medium text-xs leading-relaxed whitespace-pre-wrap break-words ${
          isContact
            ? 'bg-white border-slate-200/60 text-gray-900 chat-bubble-in'
            : outboundClass
        }`}
      >
        {message.content}
      </div>
      <div className="flex items-center gap-1 mt-1 text-meta text-gray-400 font-bold font-mono px-1">
        <span>{time}</span>
        {!isContact &&
          (message.status === 'sending' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
    </div>
  );
};

export const InboxMessageList: React.FC<Props> = ({
  messages,
  channel,
  messageEndRef,
  loading = false,
}) => {
  const isWhatsApp = channel === 'whatsapp';

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
        <div ref={messageEndRef} />
      </div>
    );
  }

  return (
    <div
      className={`flex-1 overflow-y-auto px-3 py-3 space-y-1 ${isWhatsApp ? '' : 'p-4 space-y-4'}`}
      style={isWhatsApp ? { backgroundColor: WA_CHAT_BG } : undefined}
    >
      {messages.map((group) => (
        <div key={group.dateKey} className={isWhatsApp ? 'space-y-1.5' : 'space-y-4'}>
          <div className="flex justify-center select-none py-2">
            <span
              className={
                isWhatsApp
                  ? 'px-2.5 py-1 bg-[#ffffffd9] rounded-md text-meta font-medium text-[#54656f] shadow-sm'
                  : 'px-3 py-1 bg-white border border-slate-200 rounded-full text-meta font-black text-gray-400 uppercase tracking-widest'
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

            return <MessageBubble key={message.id} message={message} channel={channel} />;
          })}
        </div>
      ))}
      <div ref={messageEndRef} />
    </div>
  );
};
