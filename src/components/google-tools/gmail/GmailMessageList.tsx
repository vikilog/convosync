import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader2, Star } from 'lucide-react';
import { GMAIL_FOLDERS, GMAIL_ROW_HEIGHT } from './constants';
import type { GmailFolder, GmailMessageSummary } from './types';
import {
  avatarTone,
  displayName,
  formatListDate,
  initials,
  senderEmail,
  visibleLabels,
} from './utils';

type GmailMessageListProps = {
  folder: GmailFolder;
  messages: GmailMessageSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
};

function MessageRow({
  msg,
  folder,
  selected,
  onSelect,
}: {
  msg: GmailMessageSummary;
  folder: GmailFolder;
  selected: boolean;
  onSelect: () => void;
}) {
  const fromRaw = folder === 'sent' || folder === 'drafts' ? msg.to : msg.from;
  const name = displayName(fromRaw) || senderEmail(fromRaw);
  const email = senderEmail(fromRaw);
  const labels = visibleLabels(msg.labelIds);
  const tone = avatarTone(email || name);

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{ height: GMAIL_ROW_HEIGHT }}
      className={`group relative w-full text-left px-4 py-3 border-b border-[#f0eef5] transition-all duration-150 ${
        selected
          ? 'bg-sky-50 border-l-[3px] border-l-primary shadow-[inset_0_0_0_1px_rgba(91,76,245,0.08)]'
          : 'border-l-[3px] border-l-transparent hover:bg-slate-50'
      }`}
    >
      <div className="flex gap-3 h-full min-w-0">
        <div
          className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-bold ${tone}`}
        >
          {initials(name)}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`text-sm truncate ${
                msg.isUnread ? 'font-bold text-gray-950' : 'font-semibold text-gray-800'
              }`}
            >
              {folder === 'sent' || folder === 'drafts' ? `To: ${name}` : name}
            </span>
            {msg.isStarred && (
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
            )}
            <span className="text-meta text-gray-400 ml-auto shrink-0 tabular-nums">
              {formatListDate(msg.internalDate, msg.date)}
            </span>
          </div>

          <p
            className={`text-sm truncate leading-snug ${
              msg.isUnread ? 'font-semibold text-gray-900' : 'text-gray-700'
            }`}
          >
            {msg.subject || '(No subject)'}
          </p>

          <p className="text-xs text-gray-400 truncate leading-snug">{msg.snippet}</p>

          {(labels.length > 0 || msg.isUnread) && (
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {msg.isUnread && (
                <span className="inline-flex items-center gap-1 text-sm font-bold uppercase tracking-wide text-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Unread
                </span>
              )}
              {labels.map((label) => (
                <span
                  key={label}
                  className="px-1.5 py-0.5 rounded-md text-sm font-semibold bg-sky-50 text-primary capitalize"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export function GmailMessageList({
  folder,
  messages,
  selectedId,
  onSelect,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
}: GmailMessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const folderLabel = GMAIL_FOLDERS.find((f) => f.id === folder)?.label ?? folder;

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => GMAIL_ROW_HEIGHT,
    overscan: 8,
  });

  return (
    <section className="w-full lg:w-[420px] shrink-0 flex flex-col min-h-0 min-w-0 border-r border-slate-200 bg-white">
      <div className="shrink-0 px-4 py-3 border-b border-slate-200 bg-slate-50/80">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">{folderLabel}</h2>
        <p className="text-meta text-gray-400 mt-0.5">{messages.length} shown</p>
      </div>

      <div ref={parentRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading messages…
          </div>
        ) : messages.length === 0 ? (
          <div className="py-20 px-6 text-center">
            <p className="text-sm font-semibold text-gray-600">No messages</p>
            <p className="text-xs text-gray-400 mt-1">This folder is empty.</p>
          </div>
        ) : (
          <div
            style={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const msg = messages[virtualRow.index];
              return (
                <div
                  key={msg.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <MessageRow
                    msg={msg}
                    folder={folder}
                    selected={selectedId === msg.id}
                    onSelect={() => onSelect(msg.id)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {hasMore && !loading && (
        <div className="shrink-0 p-3 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            disabled={loadingMore}
            onClick={onLoadMore}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-primary bg-white border border-slate-200 hover:bg-sky-50 hover:border-primary/20 disabled:opacity-50 transition-all"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </section>
  );
}
