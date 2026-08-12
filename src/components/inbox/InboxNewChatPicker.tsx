/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Loader2, Mail, Plus, Search, Send, User, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { api } from '../../lib/api';
import { mapContactFromApi } from '../../lib/mappers';
import type { WhatsAppInboxAccount } from '../../hooks/inbox/useInboxMeta';
import { stripHtmlToText } from '../templates/emailTemplateUtils';

export type NewChatChannel = 'whatsapp' | 'email' | 'instagram';

type ContactRow = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tags: string[];
};

type EmailTemplateOption = {
  id: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string | null;
  status: string;
};

function isWhatsAppPhone(phone: string): boolean {
  if (phone.startsWith('ig:') || phone.startsWith('fb:')) return false;
  const normalized = phone.replace(/[\s-]/g, '');
  return /^\+[1-9]\d{6,14}$/.test(normalized);
}

function accountLabel(acc: WhatsAppInboxAccount): string {
  return acc.label || acc.displayName || acc.phoneNumber || acc.phoneNumberId;
}

export type InboxEmailSendPayload = {
  contactId: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelectContact: (contactId: string, phoneNumberId?: string) => Promise<void>;
  onSendEmail: (payload: InboxEmailSendPayload) => Promise<void>;
  onAddNewContact: (phoneNumberId?: string) => void;
  /** Preferred channel when opening (from Inbox filter). */
  initialChannel?: NewChatChannel;
  emailReady?: boolean;
  /** Connected WhatsApp lines the user can send from (already scope-filtered). */
  whatsappAccounts?: WhatsAppInboxAccount[];
  error?: string | null;
};

export function InboxNewChatPicker({
  open,
  onClose,
  onSelectContact,
  onSendEmail,
  onAddNewContact,
  initialChannel = 'whatsapp',
  emailReady = false,
  whatsappAccounts = [],
  error,
}: Props) {
  const [channel, setChannel] = useState<NewChatChannel>(initialChannel);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [fromPhoneNumberId, setFromPhoneNumberId] = useState('');

  const [emailContact, setEmailContact] = useState<ContactRow | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [htmlBody, setHtmlBody] = useState<string | undefined>();
  const [templateId, setTemplateId] = useState('');
  const [templates, setTemplates] = useState<EmailTemplateOption[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const needsFromPick = channel === 'whatsapp' && whatsappAccounts.length > 1;
  const resolvedFromId = needsFromPick
    ? fromPhoneNumberId
    : whatsappAccounts[0]?.phoneNumberId || undefined;
  const canProceedWa = !needsFromPick || Boolean(fromPhoneNumberId);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params: Record<string, string> = { list: 'all', limit: '100' };
      if (search.trim()) params.search = search.trim();
      const res = await api.getContacts(params);
      const rows = (res.items ?? [])
        .map((row) => mapContactFromApi(row))
        .filter((c) => {
          if (channel === 'email') return Boolean(c.email?.trim());
          return isWhatsAppPhone(c.phone);
        })
        .map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          tags: c.tags,
        }));
      setContacts(rows);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load contacts');
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [search, channel]);

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const raw = (await api.getEmailTemplates()) as EmailTemplateOption[];
      const list = (raw ?? []).filter((t) => t.id && t.name && t.status === 'active');
      list.sort((a, b) => a.name.localeCompare(b.name));
      setTemplates(list);
    } catch {
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setChannel(initialChannel === 'instagram' ? 'whatsapp' : initialChannel);
    setSearch('');
    setLoadError(null);
    setSelectingId(null);
    setFromPhoneNumberId('');
    setEmailContact(null);
    setSubject('');
    setMessage('');
    setHtmlBody(undefined);
    setTemplateId('');
    setFieldError(null);
    setSending(false);
  }, [open, initialChannel]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      void loadContacts();
    }, search ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [open, loadContacts, search]);

  useEffect(() => {
    if (!open || channel !== 'email') return;
    void loadTemplates();
  }, [open, channel, loadTemplates]);

  const emptyMessage = useMemo(() => {
    if (loadError) return loadError;
    if (search.trim()) return 'No contacts match your search.';
    if (channel === 'email') return 'No contacts with an email address yet.';
    return 'No WhatsApp contacts yet. Add a contact with a phone number.';
  }, [loadError, search, channel]);

  const handleSelectWa = async (contactId: string) => {
    if (!canProceedWa) return;
    setSelectingId(contactId);
    try {
      await onSelectContact(contactId, resolvedFromId);
    } catch {
      // Parent surfaces error
    } finally {
      setSelectingId(null);
    }
  };

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    setFieldError(null);
    if (!id) {
      setHtmlBody(undefined);
      return;
    }
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    setSubject(tpl.subject || '');
    const text = (tpl.textBody?.trim() || stripHtmlToText(tpl.htmlBody || '')).trim();
    setMessage(text);
    setHtmlBody(tpl.htmlBody || undefined);
  };

  const handleSendEmail = async () => {
    setFieldError(null);
    if (!emailContact) {
      setFieldError('Select a contact to email.');
      return;
    }
    if (!emailContact.email?.trim()) {
      setFieldError('Selected contact has no email address.');
      return;
    }
    if (!subject.trim()) {
      setFieldError('Subject is required.');
      return;
    }
    if (!templateId && !message.trim() && !htmlBody?.trim()) {
      setFieldError('Message is required.');
      return;
    }
    if (!emailReady) {
      setFieldError('Email is not connected. Check your email provider in Integrations.');
      return;
    }

    setSending(true);
    try {
      // templateId → server loads HTML from template (campaign path). Custom → html+text multipart.
      await onSendEmail({
        contactId: emailContact.id,
        subject: subject.trim(),
        ...(templateId
          ? { templateId, ...(message.trim() ? { text: message.trim() } : {}) }
          : {
              text: message.trim(),
              ...(htmlBody?.trim() ? { html: htmlBody } : {}),
            }),
      });
    } catch {
      // Parent surfaces error
    } finally {
      setSending(false);
    }
  };

  if (typeof document === 'undefined') return null;

  const title =
    channel === 'email'
      ? emailContact
        ? 'Compose email'
        : 'New email'
      : 'New WhatsApp chat';
  const subtitle =
    channel === 'email'
      ? emailContact
        ? `To ${emailContact.name}`
        : 'Pick a contact with an email address'
      : 'Pick a contact or add a new one';

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
            aria-labelledby="new-chat-title"
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            className="fixed left-1/2 top-[10%] z-[100] w-[min(100vw-2rem,440px)] -translate-x-1/2 bg-surface border border-black/5 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
              <div className="min-w-0">
                <h2 id="new-chat-title" className="text-sm font-black text-gray-900">
                  {title}
                </h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5 truncate">{subtitle}</p>
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

            <div className="px-4 py-2.5 border-b border-black/5 bg-slate-50">
              <div className="flex rounded-lg bg-white p-0.5 ring-1 ring-black/5" role="tablist">
                {(
                  [
                    { id: 'whatsapp' as const, label: 'WhatsApp', disabled: false },
                    { id: 'email' as const, label: 'Email', disabled: false },
                    { id: 'instagram' as const, label: 'Instagram', disabled: true },
                  ] as const
                ).map((tab) => {
                  const active = channel === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      disabled={tab.disabled}
                      title={tab.disabled ? 'Coming soon' : undefined}
                      onClick={() => {
                        if (tab.disabled) return;
                        setChannel(tab.id);
                        setEmailContact(null);
                        setFieldError(null);
                        setSearch('');
                      }}
                      className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        active
                          ? 'bg-gray-950 text-white'
                          : 'text-gray-500 hover:text-gray-800 hover:bg-slate-50'
                      }`}
                    >
                      {tab.label}
                      {tab.disabled ? ' · soon' : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            {channel === 'email' && emailContact ? (
              <div className="p-4 space-y-3 max-h-[min(70vh,520px)] overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setEmailContact(null);
                    setFieldError(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Change contact
                </button>

                <div className="rounded-xl border border-black/5 bg-slate-50 px-3 py-2.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{emailContact.name}</p>
                    <p className="text-xs text-gray-500 font-mono truncate">{emailContact.email}</p>
                  </div>
                </div>

                {!emailReady && (
                  <p className="text-meta font-bold text-[#ba1a1a] bg-[#fef2f2] border border-[#fecaca] rounded-lg px-3 py-2">
                    Email is not connected. Enable a provider in Integrations before sending.
                  </p>
                )}

                <div>
                  <label htmlFor="new-email-template" className="block text-xs font-bold text-gray-700 mb-1">
                    Template <span className="font-medium text-gray-400">(optional)</span>
                  </label>
                  <select
                    id="new-email-template"
                    value={templateId}
                    onChange={(e) => applyTemplate(e.target.value)}
                    disabled={templatesLoading || sending}
                    className="w-full bg-surface border border-black/5 rounded-lg py-2 px-3 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-sky-200 focus:border-sky-500 outline-none"
                  >
                    <option value="">No template — write your own</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="new-email-subject" className="block text-xs font-bold text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    id="new-email-subject"
                    type="text"
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      setFieldError(null);
                    }}
                    placeholder="Subject line"
                    disabled={sending}
                    className="w-full bg-surface border border-black/5 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-sky-200 focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="new-email-body" className="block text-xs font-bold text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="new-email-body"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      // Body edit leaves template path — send as custom multipart instead.
                      setHtmlBody(undefined);
                      setTemplateId('');
                      setFieldError(null);
                    }}
                    rows={7}
                    placeholder="Write your message… Use {{name}} or {{contact.email}} for personalization"
                    disabled={sending}
                    className="w-full bg-surface border border-black/5 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-sky-200 focus:border-sky-500 outline-none resize-y min-h-[140px]"
                  />
                  <p className="text-meta text-gray-400 font-medium mt-1">
                    Variables like {'{{name}}'} resolve from the contact when sending.
                  </p>
                </div>

                {(fieldError || error) && (
                  <p className="text-meta font-bold text-[#ba1a1a] bg-[#fef2f2] border border-[#fecaca] rounded-lg px-3 py-2">
                    {fieldError || error}
                  </p>
                )}

                <button
                  type="button"
                  disabled={sending || !emailReady}
                  onClick={() => void handleSendEmail()}
                  className="w-full py-2.5 rounded-xl bg-gray-950 hover:bg-black text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send email
                </button>
              </div>
            ) : (
              <>
                {channel === 'whatsapp' && needsFromPick && (
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
                      placeholder={
                        channel === 'email'
                          ? 'Search by name or email…'
                          : 'Search by name or phone…'
                      }
                      className="w-full bg-slate-50 border border-black/5 rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-sky-200 focus:border-sky-500 outline-none"
                      autoFocus={!needsFromPick}
                    />
                  </div>
                </div>

                {(error || loadError || fieldError) && (
                  <p className="px-4 py-2 text-meta font-bold text-[#ba1a1a] bg-[#fef2f2] border-b border-[#fecaca]">
                    {fieldError || error || loadError}
                  </p>
                )}

                <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-50">
                  {loading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading contacts…
                    </div>
                  ) : contacts.length === 0 ? (
                    <p className="py-10 px-4 text-center text-sm font-bold text-gray-400">
                      {emptyMessage}
                    </p>
                  ) : (
                    contacts.map((contact) => {
                      const busy = selectingId === contact.id;
                      return (
                        <button
                          key={contact.id}
                          type="button"
                          disabled={
                            channel === 'whatsapp'
                              ? Boolean(selectingId) || !canProceedWa
                              : false
                          }
                          onClick={() => {
                            if (channel === 'email') {
                              if (!contact.email?.trim()) {
                                setFieldError('This contact has no email address.');
                                return;
                              }
                              setEmailContact(contact);
                              setFieldError(null);
                              return;
                            }
                            void handleSelectWa(contact.id);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-sky-50 transition-colors flex items-center gap-3 disabled:opacity-60"
                          title={
                            channel === 'whatsapp' && !canProceedWa
                              ? 'Select a WhatsApp number first'
                              : undefined
                          }
                        >
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                              channel === 'email'
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-[#e6f7ec] text-[#128C7E]'
                            }`}
                          >
                            {channel === 'email' ? (
                              <Mail className="w-4 h-4" />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-900 truncate">{contact.name}</p>
                            <p className="text-xs text-gray-400 font-mono truncate">
                              {channel === 'email' ? contact.email : contact.phone}
                            </p>
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

                {channel === 'whatsapp' && (
                  <div className="p-3 border-t border-black/5 bg-slate-50">
                    <button
                      type="button"
                      disabled={!canProceedWa}
                      onClick={() => onAddNewContact(resolvedFromId)}
                      className="w-full py-2.5 rounded-xl bg-gray-950 hover:bg-black text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={!canProceedWa ? 'Select a WhatsApp number first' : undefined}
                    >
                      <Plus className="w-4 h-4" />
                      Add new contact
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
