import React from 'react';
import { ArrowUpRight, Mail, MessageCircle, CheckCircle2 } from 'lucide-react';
import { formatNotificationRelativeTime } from '../../lib/notificationTime';

export type WaitingConversation = {
  id: string;
  contactName: string;
  contactAvatar?: string | null;
  channel: 'whatsapp' | 'instagram' | 'messenger' | 'email' | string;
  lastMessage: string;
  lastMessageAt: string;
};

interface NeedsReplyPanelProps {
  conversations: WaitingConversation[];
  onOpenInbox: () => void;
}

function urgency(waitMinutes: number): { stripe: string; text: string } {
  if (waitMinutes >= 120) return { stripe: 'bg-red-500', text: 'text-red-600' };
  if (waitMinutes >= 30) return { stripe: 'bg-amber-500', text: 'text-amber-700' };
  return { stripe: 'bg-slate-200', text: 'text-neutral-400' };
}

function ChannelIcon({ channel }: { channel: string }) {
  if (channel === 'email') return <Mail className="h-3 w-3" aria-hidden />;
  return <MessageCircle className="h-3 w-3" aria-hidden />;
}

export const NeedsReplyPanel: React.FC<NeedsReplyPanelProps> = ({
  conversations,
  onOpenInbox,
}) => {
  const items = conversations.slice(0, 5);
  const now = Date.now();

  return (
    <div className="flex h-full flex-col rounded-xl bg-white p-5 ring-1 ring-slate-200/80">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-lg font-medium text-neutral-900">Needs a reply</h2>
        <button
          type="button"
          onClick={onOpenInbox}
          className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover active:scale-[0.97]"
        >
          Open inbox
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mb-3 text-sm text-neutral-500">Oldest unread first</p>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <CheckCircle2 className="h-7 w-7 text-emerald-500" aria-hidden />
          <p className="mt-2 text-sm font-medium text-neutral-800">You're all caught up</p>
          <p className="mt-0.5 text-xs text-neutral-500">No unread conversations waiting.</p>
        </div>
      ) : (
        <ul className="divide-y divide-black/5">
          {items.map((c) => {
            const waitMs = Math.max(0, now - new Date(c.lastMessageAt).getTime());
            const waitMinutes = waitMs / 60_000;
            const u = urgency(waitMinutes);
            const initials = (c.contactName || '?').charAt(0).toUpperCase();

            return (
              <li key={c.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className={`h-8 w-1 shrink-0 rounded-full ${u.stripe}`} aria-hidden />
                {c.contactAvatar ? (
                  <img
                    src={c.contactAvatar}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {c.contactName}
                    </p>
                    <span className="flex shrink-0 items-center gap-1 text-[10px] uppercase text-neutral-400">
                      <ChannelIcon channel={c.channel} />
                    </span>
                  </div>
                  <p className="truncate text-xs text-neutral-500">{c.lastMessage || '—'}</p>
                </div>
                <span className={`shrink-0 text-xs font-semibold tabular-nums ${u.text}`}>
                  {formatNotificationRelativeTime(new Date(c.lastMessageAt).getTime(), now)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
