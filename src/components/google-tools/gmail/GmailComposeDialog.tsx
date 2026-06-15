import type { FormEvent } from 'react';
import { Loader2, Send, X } from 'lucide-react';

type GmailComposeDialogProps = {
  open: boolean;
  onClose: () => void;
  form: { to: string; subject: string; body: string };
  onChange: (form: { to: string; subject: string; body: string }) => void;
  onSubmit: (e: FormEvent) => void;
  sending: boolean;
};

export function GmailComposeDialog({
  open,
  onClose,
  form,
  onChange,
  onSubmit,
  sending,
}: GmailComposeDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]">
      <div
        className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-[0_24px_64px_rgba(15,23,42,0.18)] overflow-hidden"
        role="dialog"
        aria-labelledby="compose-title"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <h3 id="compose-title" className="text-sm font-black text-gray-950">
            New message
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm font-bold uppercase tracking-wider text-gray-400">
              To
            </label>
            <input
              required
              type="email"
              value={form.to}
              onChange={(e) => onChange({ ...form, to: e.target.value })}
              className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
              placeholder="recipient@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-bold uppercase tracking-wider text-gray-400">
              Subject
            </label>
            <input
              required
              type="text"
              value={form.subject}
              onChange={(e) => onChange({ ...form, subject: e.target.value })}
              className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
              placeholder="Subject"
            />
          </div>
          <div>
            <label className="text-sm font-bold uppercase tracking-wider text-gray-400">
              Message
            </label>
            <textarea
              required
              rows={8}
              value={form.body}
              onChange={(e) => onChange({ ...form, body: e.target.value })}
              className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 resize-y min-h-[180px] leading-relaxed transition-all"
              placeholder="Write your message…"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-primary text-white shadow-[0_2px_8px_rgba(91,76,245,0.25)] hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {sending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
