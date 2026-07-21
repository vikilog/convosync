/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type CannedResponseRecord = {
  id: string;
  title: string;
  content: string;
  shortcut?: string | null;
  mediaMimeType?: string | null;
  mediaFileName?: string | null;
  hasMedia?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type Props = {
  open: boolean;
  item: CannedResponseRecord | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (payload: { title: string; content: string; shortcut?: string | null }) => void;
};

export function CannedResponseModal({ open, item, saving, onClose, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [shortcut, setShortcut] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitle(item?.title ?? '');
    setContent(item?.content ?? '');
    setShortcut(item?.shortcut ?? '');
  }, [open, item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSave({
      title: title.trim(),
      content: content.trim(),
      shortcut: shortcut.trim() || null,
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="relative bg-white rounded-2xl w-full max-w-lg border border-slate-200 shadow-2xl"
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-gray-900">
                {item ? 'Edit canned response' : 'New canned response'}
              </h3>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Thank you message"
                  className="w-full border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Shortcut</label>
                <input
                  type="text"
                  value={shortcut}
                  onChange={(e) => setShortcut(e.target.value.replace(/\s/g, ''))}
                  placeholder="thanks (optional)"
                  className="w-full border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Message</label>
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, 4000))}
                  rows={6}
                  placeholder="Hi {{contact.name}}, thanks for reaching out..."
                  className="w-full border border-slate-200 rounded-xl py-2.5 px-3 text-sm resize-y min-h-[140px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Use {'{{contact.name}}'}, {'{{contact.phone}}'}, {'{{company.name}}'} for personalization.
                </p>
                <p className="text-xs text-gray-400 text-right">{content.length}/4000</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !title.trim() || !content.trim()}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-xl text-sm font-bold"
                >
                  {saving ? 'Saving…' : item ? 'Save changes' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function mapCannedResponseFromApi(raw: Record<string, unknown>): CannedResponseRecord {
  const mediaStorageKey = raw.mediaStorageKey != null ? String(raw.mediaStorageKey) : null;
  return {
    id: String(raw.id),
    title: String(raw.title ?? ''),
    content: String(raw.content ?? ''),
    shortcut: raw.shortcut != null ? String(raw.shortcut) : null,
    mediaMimeType: raw.mediaMimeType != null ? String(raw.mediaMimeType) : null,
    mediaFileName: raw.mediaFileName != null ? String(raw.mediaFileName) : null,
    hasMedia: Boolean(mediaStorageKey),
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined,
  };
}

export function applyCannedVariables(
  content: string,
  vars: Record<string, string | undefined>
): string {
  return content.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key: string) => vars[key] ?? '');
}
