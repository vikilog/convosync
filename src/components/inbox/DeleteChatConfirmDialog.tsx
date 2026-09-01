/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Loader2, X } from 'lucide-react';

type DeleteChatConfirmDialogProps = {
  open: boolean;
  contactName?: string;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteChatConfirmDialog({
  open,
  contactName,
  busy = false,
  onClose,
  onConfirm,
}: DeleteChatConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="w-full max-w-sm bg-white border border-swiss-line shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-chat-confirm-title"
      >
        <div className="flex items-center justify-between border-b border-swiss-line px-5 py-3">
          <h4 id="delete-chat-confirm-title" className="text-sm font-bold text-slate-900">
            Delete chat history
          </h4>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="cursor-pointer rounded-lg p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-slate-600">
            Delete this chat{contactName ? ` with ${contactName}` : ''}? Messages will be removed
            from the inbox. This can&apos;t be undone.
          </p>
        </div>

        <div className="flex gap-2 border-t border-swiss-line px-5 py-3">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-lg border border-swiss-line px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#ba1a1a] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#a30f0f] disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
