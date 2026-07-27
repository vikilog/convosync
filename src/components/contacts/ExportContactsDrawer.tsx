/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Contact } from '../../types';
import {
  buildContactsCsv,
  defaultExportColumnIds,
  EXPORT_COLUMNS,
  type ExportColumnId,
} from './exportContactsCsv';

type Props = {
  open: boolean;
  onClose: () => void;
  contacts: Contact[];
  /** Used in download filename, e.g. all-whatsapp */
  fileSuffix?: string;
};

export const ExportContactsDrawer: React.FC<Props> = ({
  open,
  onClose,
  contacts,
  fileSuffix = 'all',
}) => {
  const [selected, setSelected] = useState<Set<ExportColumnId>>(
    () => new Set(defaultExportColumnIds())
  );

  useEffect(() => {
    if (!open) return;
    setSelected(new Set(defaultExportColumnIds()));
  }, [open]);

  const toggle = (id: ExportColumnId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(EXPORT_COLUMNS.map((c) => c.id)));
  const selectDefaults = () => setSelected(new Set(defaultExportColumnIds()));

  const handleExport = () => {
    if (contacts.length === 0 || selected.size === 0) return;
    const ids = EXPORT_COLUMNS.map((c) => c.id).filter((id) => selected.has(id));
    const csv = buildContactsCsv(contacts, ids);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-${fileSuffix}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/40 z-40"
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-labelledby="export-contacts-title"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed top-0 right-0 h-full w-full max-w-[420px] bg-white border-l border-slate-200 z-50 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 shrink-0">
              <h2 id="export-contacts-title" className="text-base font-bold text-gray-900">
                Export contacts
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
              <p className="text-sm text-slate-600">
                Exporting{' '}
                <span className="font-semibold text-slate-900">
                  {contacts.length.toLocaleString()}
                </span>{' '}
                contact{contacts.length === 1 ? '' : 's'} from the current list. Choose columns:
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Select all
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={selectDefaults}
                  className="text-xs font-semibold text-slate-500 hover:underline"
                >
                  Defaults
                </button>
              </div>

              <ul className="space-y-1">
                {EXPORT_COLUMNS.map((col) => {
                  const checked = selected.has(col.id);
                  return (
                    <li key={col.id}>
                      <label className="flex items-center gap-3 rounded-lg px-2 py-2.5 cursor-pointer hover:bg-surface-muted">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(col.id)}
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
                        />
                        <span className="text-sm font-medium text-slate-800">{col.label}</span>
                        <span className="ml-auto text-[11px] font-mono text-slate-400">{col.id}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="shrink-0 flex justify-end gap-2 border-t border-slate-200 px-5 py-3 bg-white">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={contacts.length === 0 || selected.size === 0}
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
