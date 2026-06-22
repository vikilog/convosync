import {
  Archive,
  ArrowLeft,
  ChevronDown,
  Forward,
  Loader2,
  Mail,
  MailOpen,
  Reply,
  ReplyAll,
  Trash2,
} from 'lucide-react';
import type { GmailMessageDetail } from './types';
import { avatarTone, displayName, formatDetailDate, initials, senderEmail } from './utils';

type GmailReadingPaneProps = {
  detail: GmailMessageDetail | null;
  loading: boolean;
  empty: boolean;
  showBack?: boolean;
  onBack?: () => void;
};

function ToolbarButton({
  icon: Icon,
  label,
}: {
  icon: typeof Reply;
  label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="inline-flex items-center justify-center gap-1.5 h-8 min-w-8 px-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-white hover:text-gray-900 border border-transparent hover:border-slate-200 transition-all whitespace-nowrap shrink-0"
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="hidden min-[1280px]:inline">{label}</span>
    </button>
  );
}

export function GmailReadingPane({
  detail,
  loading,
  empty,
  showBack,
  onBack,
}: GmailReadingPaneProps) {
  if (empty) {
    return (
      <section className="flex-1 min-w-0 flex flex-col items-center justify-center bg-slate-50 p-8">
        <div className="max-w-sm text-center rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-[0_4px_24px_rgba(91,76,245,0.06)]">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-50 flex items-center justify-center mb-4">
            <Mail className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-base font-black text-gray-950">Select an email</h3>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Choose a message from your inbox to read it here.
          </p>
        </div>
      </section>
    );
  }

  if (loading || !detail) {
    return (
      <section className="flex-1 min-w-0 flex items-center justify-center bg-white">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading message…
        </div>
      </section>
    );
  }

  const fromName = displayName(detail.from) || senderEmail(detail.from);
  const tone = avatarTone(senderEmail(detail.from) || fromName);

  return (
    <section className="flex-1 min-w-0 flex flex-col bg-slate-50 overflow-hidden">
      <div className="sticky top-0 z-10 shrink-0 flex flex-wrap items-center gap-1 px-3 py-2.5 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-[0_1px_0_rgba(232,230,240,0.6)]">
        {showBack && onBack && (
          <button
            type="button"
            onClick={onBack}
            className="lg:hidden mr-1 p-2 rounded-lg text-gray-500 hover:bg-slate-50"
            aria-label="Back to list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <ToolbarButton icon={Reply} label="Reply" />
        <ToolbarButton icon={ReplyAll} label="Reply all" />
        <ToolbarButton icon={Forward} label="Forward" />
        <span className="w-px h-5 bg-slate-200 mx-1 shrink-0" />
        <ToolbarButton icon={Archive} label="Archive" />
        <ToolbarButton icon={Trash2} label="Delete" />
        <ToolbarButton icon={MailOpen} label="Mark unread" />
        <button
          type="button"
          title="More"
          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm font-semibold text-gray-500 hover:bg-white border border-transparent hover:border-slate-200"
        >
          <span className="hidden sm:inline">More</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[800px] mx-auto px-6 py-8">
          <article className="rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.04)] overflow-hidden">
            <header className="px-6 py-5 border-b border-[#f0eef5]">
              <h1 className="text-xl sm:text-2xl font-black text-gray-950 leading-tight tracking-tight break-words">
                {detail.subject || '(No subject)'}
              </h1>

              <div className="mt-4 flex items-start gap-3">
                <div
                  className={`w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-sm font-bold ${tone}`}
                >
                  {initials(fromName)}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-bold text-gray-900 break-words">{fromName}</p>
                  <p className="text-xs text-gray-500 break-all">{detail.from}</p>
                  <p className="text-xs text-gray-400">
                    To <span className="text-gray-600 break-all">{detail.to}</span>
                  </p>
                  <p className="text-xs text-gray-400 pt-1">
                    {formatDetailDate(detail.internalDate, detail.date)}
                  </p>
                </div>
              </div>
            </header>

            <div className="px-6 py-6">
              {detail.bodyHtml ? (
                <div className="gmail-html-body max-w-full overflow-x-auto rounded-xl bg-white dark:bg-gray-950">
                  <div
                    className="prose prose-sm sm:prose-base max-w-none text-gray-800 leading-relaxed dark:prose-invert [&_*]:max-w-full [&_a]:text-primary [&_a]:break-all [&_table]:!w-full [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_img]:max-w-full [&_img]:h-auto [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_td]:break-words [&_th]:break-words"
                    style={{ overflowWrap: 'anywhere' }}
                    dangerouslySetInnerHTML={{ __html: detail.bodyHtml }}
                  />
                </div>
              ) : (
                <pre className="whitespace-pre-wrap break-words font-sans text-sm text-gray-800 leading-7 [overflow-wrap:anywhere]">
                  {detail.bodyText || detail.snippet || 'No content.'}
                </pre>
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
