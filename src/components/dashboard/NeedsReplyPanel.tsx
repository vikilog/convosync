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

function urgency(waitMinutes: number): { text: string } {
  if (waitMinutes >= 120) return { text: 'text-red-600' };
  if (waitMinutes >= 30) return { text: 'text-swiss-accent' };
  return { text: 'text-swiss-muted' };
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
    <div className="flex h-full flex-col font-swiss">
      <div className="mb-1 flex items-baseline justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-swiss-muted">
          Needs a reply
        </p>
        <button
          type="button"
          onClick={onOpenInbox}
          className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-swiss-accent"
        >
          Open inbox
          <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>
      <p className="mb-3 text-[11px] text-swiss-faint">Oldest unread first</p>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <CheckCircle2 className="h-7 w-7 text-swiss-accent" aria-hidden />
          <p className="mt-2 text-sm font-medium text-swiss-ink">You're all caught up</p>
          <p className="mt-0.5 text-xs text-swiss-muted">No unread conversations waiting.</p>
        </div>
      ) : (
        <ul className="divide-y divide-swiss-line">
          {items.map((c) => {
            const waitMs = Math.max(0, now - new Date(c.lastMessageAt).getTime());
            const waitMinutes = waitMs / 60_000;
            const u = urgency(waitMinutes);
            const initials = (c.contactName || '?').charAt(0).toUpperCase();

            return (
              <li key={c.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                {c.contactAvatar ? (
                  <img
                    src={c.contactAvatar}
                    alt=""
                    className="h-7 w-7 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-swiss-line text-[11px] font-semibold text-swiss-ink">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-[13px] font-medium text-swiss-ink">
                      {c.contactName}
                    </p>
                    <span className="flex shrink-0 items-center gap-1 text-swiss-faint">
                      <ChannelIcon channel={c.channel} />
                    </span>
                  </div>
                  <p className="truncate text-[11px] text-swiss-muted">{c.lastMessage || '—'}</p>
                </div>
                <span className={`shrink-0 text-[11px] font-semibold tabular-nums ${u.text}`}>
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
