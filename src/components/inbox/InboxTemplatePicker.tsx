/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { X, Search, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { CampaignTemplate } from '../../types';
import { api } from '../../lib/api';
import { mapTemplateFromApi } from '../../lib/mappers';
import { statusUiToSlug } from '../../lib/templateLabels';
import { TemplateStatusBadge } from '../templates/TemplateStatusBadge';
import { WhatsAppTemplatePreview } from '../templates/WhatsAppTemplatePreview';
import { countBodyVariables } from '../templates/templateBuilderUtils';

type Props = {
  open: boolean;
  contactName: string;
  onClose: () => void;
  onSend: (templateId: string, variables: string[]) => Promise<void>;
  sendError?: string | null;
};

export const InboxTemplatePicker: React.FC<Props> = ({
  open,
  contactName,
  onClose,
  onSend,
  sendError,
}) => {
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [variableValues, setVariableValues] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setLoadError(null);
    setSearch('');
    setSelectedId(null);
    setVariableValues([]);

    api
      .getTemplates()
      .then((rows: Record<string, unknown>[]) => {
        const mapped = rows.map((r) => mapTemplateFromApi(r));
        setTemplates(mapped);
        const firstApproved = mapped.find((t) => t.status === 'Approved' && t.id);
        if (firstApproved?.id) {
          setSelectedId(firstApproved.id);
        } else if (mapped[0]?.id) {
          setSelectedId(mapped[0].id);
        }
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : 'Failed to load templates');
      })
      .finally(() => setLoading(false));
  }, [open]);

  const selected = useMemo(
    () => templates.find((t) => t.id === selectedId) ?? null,
    [templates, selectedId]
  );

  const varCount = selected ? countBodyVariables(selected.bodyPattern) : 0;

  useEffect(() => {
    if (!selected) {
      setVariableValues([]);
      return;
    }
    const count = countBodyVariables(selected.bodyPattern);
    setVariableValues((prev) => {
      const next = Array.from({ length: count }, (_, i) => prev[i] ?? '');
      if (count > 0 && !next[0]?.trim() && contactName) {
        const label = (selected.variables[0] || '').toLowerCase();
        if (label.includes('name') || label.includes('first')) {
          next[0] = contactName;
        }
      }
      return next;
    });
  }, [selected?.id, selected?.bodyPattern, contactName]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.bodyPattern.toLowerCase().includes(q)
    );
  }, [templates, search]);

  const canSend = selected?.status === 'Approved' && selected.id && !sending;

  const handleSend = async () => {
    if (!selected?.id || selected.status !== 'Approved') return;
    if (variableValues.some((v) => !v.trim())) return;
    setSending(true);
    try {
      await onSend(selected.id, variableValues.map((v) => v.trim()));
      onClose();
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-labelledby="inbox-template-picker-title"
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div>
                <h2 id="inbox-template-picker-title" className="text-sm font-black text-gray-900">
                  WhatsApp templates
                </h2>
                <p className="text-meta text-gray-500 mt-0.5">
                  Templates from your workspace · only Approved can be sent
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {sendError && (
              <p className="mx-5 mt-3 text-sm font-semibold text-danger-red bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {sendError}
              </p>
            )}

            {loading ? (
              <div className="flex-1 flex items-center justify-center py-16 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span className="text-sm font-bold">Loading templates…</span>
              </div>
            ) : loadError ? (
              <p className="p-8 text-sm font-bold text-danger-red text-center">{loadError}</p>
            ) : templates.length === 0 ? (
              <p className="p-8 text-sm text-gray-500 text-center">
                No templates yet. Create or sync templates from the Templates page.
              </p>
            ) : (
              <div className="flex flex-1 min-h-0 flex-col md:flex-row">
                <div className="md:w-[280px] border-b md:border-b-0 md:border-r border-slate-200 flex flex-col min-h-0">
                  <div className="p-3 border-b border-slate-200">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search templates…"
                        className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-200 focus:border-sky-500 outline-none"
                      />
                    </div>
                  </div>
                  <ul className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filtered.length === 0 ? (
                      <li className="px-3 py-6 text-xs text-gray-400 text-center">No matches</li>
                    ) : (
                      filtered.map((t) => {
                        const active = t.id === selectedId;
                        return (
                          <li key={t.id ?? t.name}>
                            <button
                              type="button"
                              onClick={() => t.id && setSelectedId(t.id)}
                              className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                                active
                                  ? 'bg-sky-50 border border-sky-200'
                                  : 'hover:bg-gray-50 border border-transparent'
                              }`}
                            >
                              <p className="text-sm font-bold text-gray-900 font-mono truncate">{t.name}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <TemplateStatusBadge status={statusUiToSlug(t.status)} />
                                <span className="text-xs text-gray-400">{t.category}</span>
                              </div>
                            </button>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </div>

                <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                  {selected ? (
                    <>
                      <div className="p-4 border-b border-slate-200 grid md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">
                              Selected
                            </p>
                            <p className="text-sm font-mono font-bold text-gray-900">{selected.name}</p>
                          </div>
                          {selected.status !== 'Approved' && (
                            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                              This template is {selected.status}. Only Approved templates can be sent on
                              WhatsApp.
                            </p>
                          )}
                          {varCount > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">
                                Variables
                              </p>
                              {Array.from({ length: varCount }, (_, i) => {
                                const label = selected.variables[i] || `Variable {{${i + 1}}}`;
                                return (
                                  <label key={i} className="block">
                                    <span className="text-sm font-bold text-gray-500">{label}</span>
                                    <input
                                      type="text"
                                      value={variableValues[i] ?? ''}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        setVariableValues((prev) => {
                                          const next = [...prev];
                                          next[i] = v;
                                          return next;
                                        });
                                      }}
                                      className="mt-1 w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-200 focus:border-sky-500 outline-none"
                                      placeholder={`Value for {{${i + 1}}}`}
                                    />
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <div className="min-h-[320px]">
                          <WhatsAppTemplatePreview
                            headerFormat={selected.header?.trim() ? 'text' : 'none'}
                            header={selected.header ?? ''}
                            body={selected.bodyPattern}
                            footer={selected.footer ?? ''}
                            variableSamples={variableValues}
                            buttonType={
                              selected.buttonType === 'URL' || selected.buttonType === 'QUICK_REPLY'
                                ? selected.buttonType
                                : ''
                            }
                            buttonText={selected.buttonText ?? ''}
                            languageLabel={selected.language}
                            category={selected.category}
                            templateName={selected.name}
                          />
                        </div>
                      </div>
                      <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-4 py-2 text-sm font-bold text-gray-600 rounded-lg border border-slate-200 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={
                            !canSend ||
                            (varCount > 0 && variableValues.some((v) => !v.trim()))
                          }
                          onClick={handleSend}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-black text-white bg-sky-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sky-700"
                        >
                          {sending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          Send template
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="p-8 text-sm text-gray-400 text-center">Select a template</p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
