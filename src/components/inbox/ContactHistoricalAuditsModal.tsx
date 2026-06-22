/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  X,
  History,
  Loader2,
  Route,
  Bot,
  Sparkles,
  Megaphone,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../lib/api';

export type ContactAuditEventType = 'journey' | 'bot' | 'ai' | 'campaign' | 'template';

export interface ContactAuditSummary {
  journeys: number;
  bots: number;
  aiReplies: number;
  campaigns: number;
  templates: number;
}

export interface ContactAuditEvent {
  id: string;
  type: ContactAuditEventType;
  title: string;
  subtitle?: string;
  status?: string;
  timestamp: string;
  stepCount?: number;
}

export interface ContactAuditResponse {
  contactId: string;
  contactName: string;
  contactPhone: string;
  summary: ContactAuditSummary;
  events: ContactAuditEvent[];
}

type Props = {
  open: boolean;
  contactId: string | null;
  contactName?: string;
  contactPhone?: string;
  onClose: () => void;
};

function formatAuditTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function statusClass(status?: string): string {
  if (!status) return 'bg-gray-100 text-gray-600';
  const s = status.toLowerCase();
  if (s.includes('completed') || s.includes('sent') || s.includes('active')) {
    return 'bg-[#e6f7ec] text-[#006d2f]';
  }
  if (s.includes('failed') || s.includes('cancelled')) {
    return 'bg-[#fef2f2] text-[#ba1a1a]';
  }
  if (s.includes('waiting') || s.includes('running')) {
    return 'bg-[#fff5e6] text-[#b45309]';
  }
  return 'bg-sky-50 text-sky-600';
}

function eventIcon(type: ContactAuditEventType) {
  switch (type) {
    case 'journey':
      return Route;
    case 'bot':
      return Bot;
    case 'ai':
      return Sparkles;
    case 'campaign':
      return Megaphone;
    case 'template':
      return FileText;
    default:
      return History;
  }
}

function eventTypeLabel(type: ContactAuditEventType): string {
  switch (type) {
    case 'journey':
      return 'Journey';
    case 'bot':
      return 'Bot';
    case 'ai':
      return 'AI Agent';
    case 'campaign':
      return 'Campaign';
    case 'template':
      return 'Template';
    default:
      return 'Activity';
  }
}

export const ContactHistoricalAuditsModal: React.FC<Props> = ({
  open,
  contactId,
  contactName,
  contactPhone,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [data, setData] = useState<ContactAuditResponse | null>(null);

  useEffect(() => {
    if (!open || !contactId) return;
    setLoading(true);
    setLoadError(null);
    setData(null);

    api
      .getContactAudits(contactId)
      .then((res) => setData(res as ContactAuditResponse))
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : 'Failed to load audit history');
      })
      .finally(() => setLoading(false));
  }, [open, contactId]);

  const summary = data?.summary;
  const displayName = data?.contactName ?? contactName ?? 'Contact';
  const displayPhone = data?.contactPhone ?? contactPhone ?? '';

  const summaryCards = summary
    ? [
        { label: 'Journeys', value: summary.journeys, icon: Route, color: 'text-sky-600' },
        { label: 'Bots', value: summary.bots, icon: Bot, color: 'text-[#128C7E]' },
        { label: 'AI replies', value: summary.aiReplies, icon: Sparkles, color: 'text-[#7c3aed]' },
        { label: 'Campaigns', value: summary.campaigns, icon: Megaphone, color: 'text-[#f2994a]' },
        { label: 'Templates', value: summary.templates, icon: FileText, color: 'text-gray-600' },
      ]
    : [];

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
            <div className="flex justify-between items-start px-5 py-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-sky-600" />
                  <h3 className="text-base font-bold text-gray-900">Historical Audits</h3>
                </div>
                <p className="text-sm text-gray-500 mt-1 font-semibold">
                  {displayName}
                  {displayPhone ? (
                    <span className="text-gray-400 font-mono ml-1.5">{displayPhone}</span>
                  ) : null}
                </p>
              </div>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-20 text-gray-400">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
            ) : loadError ? (
              <div className="p-6 text-center text-sm font-semibold text-[#ba1a1a]">{loadError}</div>
            ) : (
              <>
                {summary && (
                  <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/60">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
                      Summary
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {summaryCards.map((card) => (
                        <div
                          key={card.label}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center"
                        >
                          <card.icon className={`w-4 h-4 mx-auto mb-1 ${card.color}`} />
                          <p className="text-lg font-black text-gray-900 leading-none">{card.value}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-1">
                            {card.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
                    Activity timeline
                  </p>
                  {!data?.events.length ? (
                    <p className="text-sm text-gray-500 font-semibold text-center py-10">
                      No automation activity recorded for this contact yet.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {data.events.map((event) => {
                        const Icon = eventIcon(event.type);
                        return (
                          <li
                            key={event.id}
                            className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3"
                          >
                            <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4 text-sky-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-gray-900 truncate">
                                    {event.title}
                                  </p>
                                  <p className="text-xs font-semibold text-gray-400 mt-0.5">
                                    {eventTypeLabel(event.type)}
                                    {event.subtitle ? ` · ${event.subtitle}` : ''}
                                  </p>
                                </div>
                                {event.status && (
                                  <span
                                    className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${statusClass(event.status)}`}
                                  >
                                    {event.status}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 font-mono mt-1.5">
                                {formatAuditTime(event.timestamp)}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
