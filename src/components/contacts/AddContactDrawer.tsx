/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { X, Plus, Info, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../lib/api';

export type NewContactPayload = {
  name: string;
  phone: string;
  email?: string;
  source?: string;
  tags: string[];
  customFields?: Record<string, string>;
  ownerId?: string;
};

export type ContactEditPayload = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tags: string[];
  customFields?: Record<string, string>;
  channel?: 'whatsapp' | 'instagram' | 'messenger';
  excludeFromInsights?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (contact?: { id: string }) => void;
  onSaved?: () => void;
  /** When set, drawer opens in edit mode for this contact. */
  editContact?: ContactEditPayload | null;
};

const COUNTRY_CODES = [
  { code: '+91', label: 'IN +91' },
  { code: '+1', label: 'US +1' },
  { code: '+971', label: 'AE +971' },
  { code: '+44', label: 'UK +44' },
];

type Member = { userId: string; name: string; email: string };

const INSTAGRAM_FIELD_PREFIX = 'instagram';

function isSyntheticChannelPhone(phone: string): boolean {
  return phone.startsWith('fb:') || phone.startsWith('ig:');
}

function parsePhoneParts(phone: string): { countryCode: string; local: string } {
  if (!phone.startsWith('+')) {
    return { countryCode: '+91', local: phone.replace(/\D/g, '') };
  }
  const match = COUNTRY_CODES.map((c) => c.code)
    .sort((a, b) => b.length - a.length)
    .find((code) => phone.startsWith(code));
  if (!match) return { countryCode: '+91', local: phone.replace(/\D/g, '') };
  return {
    countryCode: match,
    local: phone.slice(match.length).replace(/\D/g, ''),
  };
}

function customFieldsToRows(fields: Record<string, string> | undefined): { key: string; value: string }[] {
  if (!fields) return [];
  return Object.entries(fields)
    .filter(
      ([key]) =>
        key !== 'ownerId' &&
        !key.startsWith(INSTAGRAM_FIELD_PREFIX)
    )
    .map(([key, value]) => ({ key, value: String(value) }));
}

export function AddContactDrawer({ open, onClose, onCreated, onSaved, editContact }: Props) {
  const isEdit = Boolean(editContact?.id);
  const [nickname, setNickname] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [excludeFromInsights, setExcludeFromInsights] = useState(false);
  const [customAttrs, setCustomAttrs] = useState<{ key: string; value: string }[]>([]);
  const [showCustom, setShowCustom] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    api
      .getWorkspaceMembers()
      .then((list: { userId: string; name: string; email: string }[]) => {
        setMembers(list);
        if (!isEdit && list[0] && !ownerId) setOwnerId(list[0].userId);
      })
      .catch(() => {});
  }, [open, isEdit]);

  useEffect(() => {
    if (!open || !editContact) return;
    const { countryCode: cc, local } = parsePhoneParts(editContact.phone);
    setNickname(editContact.name);
    setCountryCode(cc);
    setPhone(local);
    setEmail(editContact.email ?? '');
    setTags(editContact.tags ?? []);
    setExcludeFromInsights(Boolean(editContact.excludeFromInsights));
    const cf = editContact.customFields ?? {};
    setOwnerId(typeof cf.ownerId === 'string' ? cf.ownerId : '');
    const rows = customFieldsToRows(cf);
    setCustomAttrs(rows);
    setShowCustom(rows.length > 0);
    setTagInput('');
    setError(null);
  }, [open, editContact]);

  const reset = () => {
    setNickname('');
    setCountryCode('+91');
    setPhone('');
    setEmail('');
    setOwnerId('');
    setTagInput('');
    setTags([]);
    setExcludeFromInsights(false);
    setCustomAttrs([]);
    setShowCustom(false);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const addTag = (value: string) => {
    const t = value.trim();
    if (!t || tags.includes(t)) return;
    setTags((prev) => [...prev, t]);
    setTagInput('');
  };

  const fullPhone = useMemo(() => {
    const digits = phone.replace(/\D/g, '');
    const cc = countryCode.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith(cc)) return `+${digits}`;
    return `${countryCode}${digits}`;
  }, [countryCode, phone]);

  const phoneLocked =
    isEdit &&
    (isSyntheticChannelPhone(editContact?.phone ?? '') ||
      editContact?.channel === 'instagram' ||
      editContact?.channel === 'messenger');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Nickname is required.');
      return;
    }
    if (!phoneLocked && (!fullPhone || fullPhone.length < 8)) {
      setError('A valid phone number is required.');
      return;
    }

    const customFields: Record<string, string> = {};
    if (editContact?.customFields) {
      for (const [key, value] of Object.entries(editContact.customFields)) {
        if (key.startsWith(INSTAGRAM_FIELD_PREFIX)) customFields[key] = String(value);
      }
    }
    for (const row of customAttrs) {
      const k = row.key.trim();
      if (k) customFields[k] = row.value;
    }
    if (ownerId) customFields.ownerId = ownerId;

    setSaving(true);
    setError(null);
    try {
      if (isEdit && editContact) {
        await api.updateContact(editContact.id, {
          name: nickname.trim(),
          ...(phoneLocked ? {} : { phone: fullPhone }),
          email: email.trim() || null,
          tags,
          excludeFromInsights,
          customFields: Object.keys(customFields).length ? customFields : undefined,
        });
      } else {
        const created = (await api.createContact({
          name: nickname.trim(),
          phone: fullPhone,
          email: email.trim() || undefined,
          source: 'Manual',
          tags,
          ownerId: ownerId || undefined,
          customFields: Object.keys(customFields).length ? customFields : undefined,
        })) as Record<string, unknown>;
        reset();
        onSaved?.();
        onCreated?.({ id: String(created.id) });
        onClose();
        return;
      }
      reset();
      onSaved?.();
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : isEdit ? 'Could not update contact' : 'Could not create contact');
    } finally {
      setSaving(false);
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
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed top-0 right-0 h-full w-full max-w-[420px] bg-white border-l border-slate-200 z-50 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h2 className="text-base font-bold text-gray-900">
                {isEdit ? 'Edit contact' : 'Add a new contact'}
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              id="add-contact-form"
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto px-5 py-5 space-y-5"
            >
              <div>
                <p className="text-sm font-bold text-gray-800 mb-3">System attributes</p>

                <label className="block mb-4">
                  <span className="text-meta font-semibold text-gray-600">
                    Nickname <span className="text-red-500">*</span>
                  </span>
                  <input
                    required
                    maxLength={250}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Please enter"
                    className="mt-1.5 w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="text-xs text-gray-400 mt-1 block text-right">
                    {nickname.length}/250
                  </span>
                </label>

                <label className="block mb-4">
                  <span className="text-meta font-semibold text-gray-600">
                    Phone number {!phoneLocked && <span className="text-red-500">*</span>}
                  </span>
                  {phoneLocked ? (
                    <input
                      readOnly
                      value={editContact?.phone ?? ''}
                      className="mt-1.5 w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-gray-50 text-gray-500"
                    />
                  ) : (
                    <div className="mt-1.5 flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-[100px] shrink-0 text-sm border border-slate-200 rounded-lg px-2 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <input
                        required
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Phone number"
                        className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  )}
                  {phoneLocked && (
                    <span className="text-xs text-gray-400 mt-1 block">
                      Phone cannot be changed for Instagram/Messenger contacts.
                    </span>
                  )}
                </label>

                <label className="block mb-4">
                  <span className="text-meta font-semibold text-gray-600 flex items-center gap-1">
                    Owner
                    <Info className="w-3 h-3 text-gray-400" aria-hidden />
                  </span>
                  <select
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    className="mt-1.5 w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block mb-4">
                  <span className="text-meta font-semibold text-gray-600">Email</span>
                  <input
                    type="email"
                    maxLength={250}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Please enter"
                    className="mt-1.5 w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="text-xs text-gray-400 mt-1 block text-right">
                    {email.length}/250
                  </span>
                </label>

                <div className="block">
                  <span className="text-meta font-semibold text-gray-600">Tag</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 mb-2">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-primary text-meta font-bold"
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(tagInput);
                      }
                    }}
                    placeholder="Select or create a new tag"
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {isEdit && (
                  <label className="mt-4 flex items-start gap-2.5 cursor-pointer rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={excludeFromInsights}
                      onChange={(e) => setExcludeFromInsights(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>
                      <span className="block text-sm font-bold text-gray-800">
                        Exclude from AI insights
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500 leading-snug">
                        For team/test numbers — never run customer insight scoring on this contact.
                      </span>
                    </span>
                  </label>
                )}
              </div>

              {!showCustom ? (
                <button
                  type="button"
                  onClick={() => setShowCustom(true)}
                  className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Customized attributes
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-gray-800">Customized attributes</p>
                  {customAttrs.map((row, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={row.key}
                        onChange={(e) => {
                          const next = [...customAttrs];
                          next[i] = { ...next[i], key: e.target.value };
                          setCustomAttrs(next);
                        }}
                        placeholder="Attribute name"
                        className="flex-1 text-sm border border-slate-200 rounded-lg px-2 py-2"
                      />
                      <input
                        value={row.value}
                        onChange={(e) => {
                          const next = [...customAttrs];
                          next[i] = { ...next[i], value: e.target.value };
                          setCustomAttrs(next);
                        }}
                        placeholder="Value"
                        className="flex-1 text-sm border border-slate-200 rounded-lg px-2 py-2"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCustomAttrs((prev) => [...prev, { key: '', value: '' }])}
                    className="text-sm font-bold text-primary"
                  >
                    + Add attribute
                  </button>
                </div>
              )}

              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
            </form>

            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-contact-form"
                disabled={saving}
                className="px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-60 inline-flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEdit ? 'Save changes' : 'Submit'}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
