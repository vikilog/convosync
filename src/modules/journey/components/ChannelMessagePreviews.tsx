import { MessageCircle } from 'lucide-react';
import { sampleMessagePreview } from '../lib/triggerChannels';

type Props = {
  /** Plain text body (after template render if needed). */
  body: string;
  emptyHint?: string;
};

/** WhatsApp outbound bubble preview. */
export function ChannelMessagePreviews({
  body,
  emptyHint = 'Write a message to preview how it looks on WhatsApp.',
}: Props) {
  const preview = sampleMessagePreview(body);

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        WhatsApp preview
      </p>
      {!preview ? (
        <p className="rounded-lg border border-dashed border-border-subtle bg-surface-muted/50 px-3 py-4 text-center text-xs text-slate-400">
          {emptyHint}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border-[0.5px] border-border-subtle bg-[#efeae2]">
          <div className="flex items-center gap-1.5 border-b border-swiss-line px-2.5 py-1.5">
            <MessageCircle className="h-3.5 w-3.5 text-channel-green" strokeWidth={2.25} />
            <span className="text-[11px] font-semibold text-channel-green">WhatsApp</span>
          </div>
          <div className="flex justify-end p-2.5">
            <div className="max-w-[92%] rounded-2xl rounded-tr-sm bg-channel-green px-2.5 py-2 text-[11px] leading-relaxed whitespace-pre-wrap break-words text-white">
              {preview}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
