/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Plus, Search, User, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { api } from '../../lib/api';
import { mapContactFromApi } from '../../lib/mappers';
import type { WhatsAppInboxAccount } from '../../hooks/inbox/useInboxMeta';

type WhatsAppContactRow = {
  id: string;
  name: string;
  phone: string;
  tags: string[];
};

function isWhatsAppPhone(phone: string): boolean {
  if (phone.startsWith('ig:') || phone.startsWith('fb:')) return false;
  const normalized = phone.replace(/[\s-]/g, '');
  return /^\+[1-9]\d{6,14}$/.test(normalized);
}

function accountLabel(acc: WhatsAppInboxAccount): string {
  return acc.label || acc.displayName || acc.phoneNumber || acc.phoneNumberId;
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSelectContact: (contactId: string, phoneNumberId?: string) => Promise<void>;
  onAddNewContact: (phoneNumberId?: string) => void;
  /** Connected WhatsApp lines the user can send from (already scope-filtered). */
  whatsappAccounts?: WhatsAppInboxAccount[];
  error?: string | null;
};

export function InboxNewChatPicker({
  open,
  onClose,
  onSelectContact,
  onAddNewContact,
  whatsappAccounts = [],
  error,
}: Props) {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<WhatsAppContactRow[]>([]);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [fromPhoneNumberId, setFromPhoneNumberId] = useState('');

  const needsFromPick = whatsappAccounts.length > 1;
  const resolvedFromId = needsFromPick
    ? fromPhoneNumberId
    : whatsappAccounts[0]?.phoneNumberId || undefined;
  const canProceed = !needsFromPick || Boolean(fromPhoneNumberId);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params: Record<string, string> = { list: 'all' };
      if (search.trim()) params.search = search.trim();
      const raw = (await api.getContacts(params)) as Record<string, unknown>[];
      const rows = raw
        .map((row) => mapContactFromApi(row))
        .filter((c) => isWhatsAppPhone(c.phone))
        .map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          tags: c.tags,
        }));
      setContacts(rows);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load contacts');
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setLoadError(null);
    setSelectingId(null);
    setFromPhoneNumberId('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      void loadContacts();
    }, search ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [open, loadContacts, search]);

  const emptyMessage = useMemo(() => {
    if (loadError) return loadError;
    if (search.trim()) return 'No contacts match your search.';
    return 'No WhatsApp contacts yet. Add a contact with a phone number.';
  }, [loadError, search]);

  const handleSelect = async (contactId: string) => {
    if (!canProceed) return;
    setSelectingId(contactId);
    try {
      await onSelectContact(contactId, resolvedFromId);
    } catch {
      // Parent surfaces error
    } finally {
      setSelectingId(null);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/40 z-[100]"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-wa-chat-title"
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            className="fixed left-1/2 top-[12%] z-[100] w-[min(100vw-2rem,400px)] -translate-x-1/2 bg-surface border border-black/5 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
              <div>
                <h2 id="new-wa-chat-title" className="text-sm font-black text-gray-900">
                  New WhatsApp chat
                </h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Pick a contact or add a new one
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {needsFromPick && (
              <div className="px-4 py-3 border-b border-black/5 bg-slate-50">
                <label
                  htmlFor="new-wa-chat-from"
                  className="block text-xs font-bold text-gray-700 mb-1.5"
                >
                  Send from which number?
                </label>
                <select
                  id="new-wa-chat-from"
                  value={fromPhoneNumberId}
                  onChange={(e) => setFromPhoneNumberId(e.target.value)}
                  className="w-full bg-surface border border-black/5 rounded-lg py-2 px-3 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-sky-200 focus:border-sky-500 outline-none"
                >
                  <option value="">Select a WhatsApp number…</option>
                  {whatsappAccounts.map((acc) => (
                    <option key={acc.phoneNumberId} value={acc.phoneNumberId}>
                      {accountLabel(acc)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="p-3 border-b border-black/5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or phone…"
                  className="w-full bg-slate-50 border border-black/5 rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-sky-200 focus:border-sky-500 outline-none"
                  autoFocus={!needsFromPick}
                />
              </div>
            </div>

            {(error || loadError) && (
              <p className="px-4 py-2 text-meta font-bold text-[#ba1a1a] bg-[#fef2f2] border-b border-[#fecaca]">
                {error || loadError}
              </p>
            )}

            <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-50">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading contacts…
                </div>
              ) : contacts.length === 0 ? (
                <p className="py-10 px-4 text-center text-sm font-bold text-gray-400">{emptyMessage}</p>
              ) : (
                contacts.map((contact) => {
                  const busy = selectingId === contact.id;
                  return (
                    <button
                      key={contact.id}
                      type="button"
                      disabled={Boolean(selectingId) || !canProceed}
                      onClick={() => void handleSelect(contact.id)}
                      className="w-full text-left px-4 py-3 hover:bg-sky-50 transition-colors flex items-center gap-3 disabled:opacity-60"
                      title={!canProceed ? 'Select a WhatsApp number first' : undefined}
                    >
                      <div className="w-9 h-9 rounded-full bg-[#e6f7ec] text-[#128C7E] flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate">{contact.name}</p>
                        <p className="text-xs text-gray-400 font-mono truncate">{contact.phone}</p>
                        {contact.tags.length > 0 && (
                          <p className="text-meta text-sky-600 font-bold mt-0.5 truncate">
                            {contact.tags.slice(0, 2).join(' · ')}
                          </p>
                        )}
                      </div>
                      {busy && <Loader2 className="w-4 h-4 animate-spin text-sky-600 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>

            <div className="p-3 border-t border-black/5 bg-slate-50">
              <button
                type="button"
                disabled={!canProceed}
                onClick={() => onAddNewContact(resolvedFromId)}
                className="w-full py-2.5 rounded-xl bg-gray-950 hover:bg-black text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={!canProceed ? 'Select a WhatsApp number first' : undefined}
              >
                <Plus className="w-4 h-4" />
                Add new contact
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
