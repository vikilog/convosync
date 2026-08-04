import { Instagram } from 'lucide-react';
import type { IgQuickReply } from '../types';

type Props = {
  text: string;
  quickReplies?: IgQuickReply[];
  /** Compact variant for canvas cards */
  compact?: boolean;
  emptyHint?: string;
};

/**
 * Preview that mirrors how an outbound Instagram DM + quick replies look in the app.
 * Sent bubbles use Instagram’s DM blue; quick replies are outline pills under the message.
 */
export function IgDmPreview({
  text,
  quickReplies = [],
  compact = false,
  emptyHint = 'Type a message to preview the Instagram DM.',
}: Props) {
  const body = text.trim();
  const replies = quickReplies.map((r) => r.title.trim()).filter(Boolean);

  if (!body && replies.length === 0) {
    return (
      <p
        className={`rounded-xl border border-dashed border-border-subtle bg-surface-muted/40 text-center text-slate-400 ${
          compact ? 'px-2 py-2 text-[10px]' : 'px-3 py-4 text-xs'
        }`}
      >
        {emptyHint}
      </p>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-xl border-[0.5px] border-border-subtle bg-white ${
        compact ? '' : ''
      }`}
    >
      {!compact ? (
        <div className="flex items-center gap-2 border-b border-black/[0.06] px-2.5 py-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCB045]">
            <Instagram className="h-3.5 w-3.5 text-white" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-slate-800">Instagram DM</p>
            <p className="text-[9px] text-slate-400">How it looks to the contact</p>
          </div>
        </div>
      ) : null}

      <div className={`bg-[#fafafa] ${compact ? 'p-2' : 'p-3'}`}>
        {body ? (
          <div className="flex justify-end">
            {/* Instagram outbound bubble — Meta blue, tail on bottom-right */}
            <div
              className={`max-w-[88%] rounded-[18px] rounded-br-md bg-[#3797F0] text-white shadow-sm ${
                compact
                  ? 'px-2.5 py-1.5 text-[10px] leading-snug'
                  : 'px-3 py-2 text-[12px] leading-relaxed'
              } whitespace-pre-wrap break-words`}
            >
              {body}
            </div>
          </div>
        ) : null}

        {replies.length > 0 ? (
          <div
            className={`flex flex-wrap gap-1.5 ${body ? (compact ? 'mt-1.5' : 'mt-2.5') : ''}`}
          >
            {replies.map((title, i) => (
              <span
                key={`${title}-${i}`}
                className={`rounded-full border border-[#3797F0]/45 bg-white font-medium text-[#3797F0] ${
                  compact
                    ? 'px-2 py-0.5 text-[9px]'
                    : 'px-3 py-1 text-[11px]'
                }`}
              >
                {title}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
