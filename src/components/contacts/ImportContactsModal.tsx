/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { X, Upload, Loader2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api, formatCatchError } from '../../lib/api';
import { parseContactCsv, type ContactCsvRow } from './parseContactCsv';

type Props = {
  open: boolean;
  onClose: () => void;
  onImported?: () => void;
};

type ImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; phone: string; error: string }[];
};

const TEMPLATE_CSV = `name,phone,email,tags
Alice Sharma,+919876543210,alice@example.com,Hot;Lead
Bob Khan,+919811122233,,Student
`;

const IMPORT_SOURCES = [
  'WhatsApp',
  'Instagram',
  'Email',
  'Messenger',
  'Website',
  'Manual',
] as const;

/** ponytail: chunk so one fat body / long upsert loop doesn't timeout; ceiling = request size not row count */
const IMPORT_CHUNK = 400;

export const ImportContactsModal: React.FC<Props> = ({ open, onClose, onImported }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ContactCsvRow[]>([]);
  const [parseSkipped, setParseSkipped] = useState<number[]>([]);
  const [fileName, setFileName] = useState('');
  const [source, setSource] = useState<string>('WhatsApp');
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);

  const reset = () => {
    setPreview([]);
    setParseSkipped([]);
    setFileName('');
    setSource('WhatsApp');
    setError('');
    setImporting(false);
    setProgress('');
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleClose = () => {
    if (importing) return;
    reset();
    onClose();
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setResult(null);
    setProgress('');
    setFileName(file.name);
    try {
      const text = await file.text();
      const { rows, skipped } = parseContactCsv(text);
      if (rows.length === 0) {
        setPreview([]);
        setParseSkipped(skipped);
        setError('No valid rows found. Need name + phone columns.');
        return;
      }
      setPreview(rows);
      setParseSkipped(skipped);
    } catch (err) {
      setPreview([]);
      setError(formatCatchError(err));
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const runImport = async () => {
    if (preview.length === 0) return;
    const sourceValue = source.trim() || 'WhatsApp';
    setImporting(true);
    setError('');
    setProgress('');
    try {
      const withSource = preview.map((row) => ({ ...row, source: sourceValue }));
      const agg: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };
      const totalChunks = Math.ceil(withSource.length / IMPORT_CHUNK);
      for (let c = 0; c < totalChunks; c++) {
        const start = c * IMPORT_CHUNK;
        const chunk = withSource.slice(start, start + IMPORT_CHUNK);
        setProgress(`Importing ${Math.min(start + chunk.length, withSource.length)} / ${withSource.length}…`);
        const res = (await api.importContacts(chunk)) as ImportResult;
        agg.created += res.created;
        agg.updated += res.updated;
        agg.skipped += res.skipped;
        for (const e of res.errors) {
          agg.errors.push({ ...e, row: e.row + start });
        }
      }
      setResult(agg);
      setProgress('');
      onImported?.();
    } catch (err) {
      setError(formatCatchError(err));
      setProgress('');
    } finally {
      setImporting(false);
    }
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
            onClick={handleClose}
          />
          <motion.aside
            role="dialog"
            aria-labelledby="import-contacts-title"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed top-0 right-0 h-full w-full max-w-[560px] bg-white border-l border-swiss-line z-50 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-swiss-line shrink-0">
              <h2 id="import-contacts-title" className="text-base font-bold text-swiss-ink">
                Import contacts (CSV)
              </h2>
              <button
                type="button"
                onClick={handleClose}
                disabled={importing}
                className="p-1.5 rounded-lg text-swiss-faint hover:text-swiss-ink hover:bg-gray-100 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 flex flex-col px-5 py-4 gap-4">
              <p className="text-sm text-slate-600 shrink-0">
                Columns: <span className="font-semibold">name</span>,{' '}
                <span className="font-semibold">phone</span> (required). Optional: email, tags (
                <code className="text-xs">;</code> or <code className="text-xs">|</code>). Same
                phone → update. Source is set below for all rows.
              </p>

              <label className="block shrink-0">
                <span className="text-meta font-semibold text-swiss-muted">Source</span>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  disabled={importing || Boolean(result)}
                  className="mt-1.5 w-full text-sm border border-swiss-line rounded-lg px-3 py-2.5 font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                >
                  {IMPORT_SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={downloadTemplate}
                  disabled={importing}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-swiss-line px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-surface-muted disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Template
                </button>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={importing}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/15 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  Choose CSV
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => void onFile(e.target.files?.[0])}
                />
              </div>

              {fileName && (
                <p className="text-xs text-slate-500 truncate shrink-0">
                  File: {fileName}
                  {preview.length > 0 && ` · ${preview.length.toLocaleString()} ready`}
                  {parseSkipped.length > 0 && ` · ${parseSkipped.length} rows skipped`}
                </p>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 shrink-0">
                  {error}
                </p>
              )}

              {progress && (
                <p className="text-sm text-slate-600 shrink-0 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  {progress}
                </p>
              )}

              {preview.length > 0 && !result && (
                <div className="flex-1 min-h-0 rounded-xl border border-swiss-line overflow-hidden flex flex-col">
                  <div className="flex-1 min-h-0 overflow-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white sticky top-0 z-10">
                        <tr>
                          <th className="px-2 py-2 font-semibold w-10">#</th>
                          <th className="px-2 py-2 font-semibold">Name</th>
                          <th className="px-2 py-2 font-semibold">Phone</th>
                          <th className="px-2 py-2 font-semibold">Email</th>
                          <th className="px-2 py-2 font-semibold">Tags</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((r, i) => (
                          <tr key={`${r.phone}-${i}`} className="border-t border-swiss-line">
                            <td className="px-2 py-1.5 text-slate-400 tabular-nums">{i + 1}</td>
                            <td className="px-2 py-1.5 max-w-[9rem] truncate" title={r.name}>
                              {r.name}
                            </td>
                            <td className="px-2 py-1.5 font-mono whitespace-nowrap">{r.phone}</td>
                            <td className="px-2 py-1.5 max-w-[8rem] truncate text-slate-600">
                              {r.email || '—'}
                            </td>
                            <td className="px-2 py-1.5 max-w-[7rem] truncate text-slate-600">
                              {r.tags.join(', ') || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {result && (
                <div className="rounded-xl border border-primary/20 bg-primary/[0.04] px-3 py-3 text-sm space-y-1 shrink-0">
                  <p className="font-semibold text-slate-900">Import complete</p>
                  <p className="text-slate-700">
                    Created {result.created} · Updated {result.updated}
                    {result.skipped > 0 ? ` · Failed ${result.skipped}` : ''}
                  </p>
                  {result.errors.length > 0 && (
                    <ul className="text-xs text-red-600 max-h-32 overflow-auto list-disc pl-4">
                      {result.errors.slice(0, 20).map((e) => (
                        <li key={`${e.row}-${e.phone}`}>
                          Row {e.row} ({e.phone}): {e.error}
                        </li>
                      ))}
                      {result.errors.length > 20 && (
                        <li>…and {result.errors.length - 20} more</li>
                      )}
                    </ul>
                  )}
                </div>
              )}

              {!preview.length && !result && !error && (
                <div className="flex-1 flex items-center justify-center rounded-xl border border-dashed border-black/10 text-sm text-slate-400 px-4 text-center">
                  Choose a CSV to preview contacts here
                </div>
              )}
            </div>

            <div className="shrink-0 flex justify-end gap-2 border-t border-swiss-line px-5 py-3 bg-white">
              <button
                type="button"
                onClick={handleClose}
                disabled={importing}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-surface-muted disabled:opacity-50"
              >
                {result ? 'Close' : 'Cancel'}
              </button>
              {!result && (
                <button
                  type="button"
                  disabled={preview.length === 0 || importing}
                  onClick={() => void runImport()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
                >
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Import {preview.length > 0 ? preview.length.toLocaleString() : ''}
                </button>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
