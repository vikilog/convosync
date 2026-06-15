/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { X, Search, MessageSquareText, Loader2, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../lib/api';
import {
  applyCannedVariables,
  mapCannedResponseFromApi,
  type CannedResponseRecord,
} from '../templates/CannedResponseModal';

export type CannedSelection = {
  message: string;
  cannedId: string;
  hasMedia: boolean;
  mediaFileName?: string | null;
};

type Props = {
  open: boolean;
  contactName?: string;
  contactPhone?: string;
  onClose: () => void;
  onSelect: (selection: CannedSelection) => void;
};

export const InboxCannedResponsePicker: React.FC<Props> = ({
  open,
  contactName,
  contactPhone,
  onClose,
  onSelect,
}) => {
  const [items, setItems] = useState<CannedResponseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setLoadError(null);
    setSearch('');
    api
      .getCannedResponses()
      .then((rows: Record<string, unknown>[]) => {
        const mapped = (rows ?? []).map(mapCannedResponseFromApi);
        setItems(mapped);
        setSelectedId(mapped[0]?.id ?? null);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : 'Failed to load canned responses');
      })
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        (item.shortcut ?? '').toLowerCase().includes(q)
    );
  }, [items, search]);

  const selected = filtered.find((i) => i.id === selectedId) ?? filtered[0] ?? null;

  const preview = selected
    ? applyCannedVariables(selected.content, {
        'contact.name': contactName ?? '',
        'contact.phone': contactPhone ?? '',
      })
    : '';

  const handleUse = () => {
    if (!selected) return;
    onSelect({
      message: preview,
      cannedId: selected.id,
      hasMedia: Boolean(selected.hasMedia),
      mediaFileName: selected.mediaFileName,
    });
    onClose();
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
            className="relative bg-white rounded-2xl w-full max-w-2xl border border-slate-200 shadow-2xl flex flex-col max-h-[85vh]"
          >
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <MessageSquareText className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-gray-900">Canned responses</h3>
              </div>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search canned responses..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-16 text-gray-400">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
            ) : loadError ? (
              <p className="p-6 text-sm font-bold text-red-500">{loadError}</p>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-bold text-gray-600">No canned responses yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Create them under Templates → Canned response.
                </p>
              </div>
            ) : (
              <div className="flex flex-1 min-h-0">
                <div className="w-2/5 border-r border-slate-200 overflow-y-auto">
                  {filtered.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`w-full text-left px-4 py-3 border-b border-slate-200/60 transition-colors ${
                        selected?.id === item.id ? 'bg-sky-50 text-sky-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-sm font-bold truncate flex items-center gap-1.5">
                        <span className="truncate">{item.title}</span>
                        {item.hasMedia && <Paperclip className="w-3 h-3 text-gray-400 shrink-0" />}
                      </p>
                      {item.shortcut && (
                        <p className="text-xs text-gray-400 font-mono mt-0.5">/{item.shortcut}</p>
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex-1 p-4 flex flex-col min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">
                    Preview
                  </p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded-xl p-3 flex-1 overflow-y-auto min-h-[120px]">
                    {preview || (selected?.hasMedia ? '(Media only — caption optional)' : '')}
                  </p>
                  {selected?.hasMedia && (
                    <p className="text-xs text-sky-600 font-bold mt-2 flex items-center gap-1">
                      <Paperclip className="w-3 h-3" />
                      Includes attachment{selected.mediaFileName ? `: ${selected.mediaFileName}` : ''}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selected}
                onClick={handleUse}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold"
              >
                Insert {selected?.hasMedia ? 'reply' : 'message'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
