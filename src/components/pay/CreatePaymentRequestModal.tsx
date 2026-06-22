import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, MessageSquare, X } from 'lucide-react';
import { api } from '../../lib/api';
import { mapTemplateFromApi } from '../../lib/mappers';
import type { CampaignTemplate } from '../../types';
import { WhatsAppTemplatePreview } from '../templates/WhatsAppTemplatePreview';
import {
  countBodyVariables,
  headerFormatFromApi,
} from '../templates/templateBuilderUtils';
import { TemplateStatusBadge } from '../templates/TemplateStatusBadge';
import { statusUiToSlug } from '../../lib/templateLabels';
import {
  buildPaymentTemplateVariables,
  buildPlainPaymentPreview,
} from './payTemplateUtils';

type ContactRow = {
  id: string;
  name: string;
  phone: string;
};

type SendMode = 'plain' | 'template';

type CreatePaymentRequestModalProps = {
  onClose: () => void;
  onCreated: () => void;
};

function PlainMessagePreview({ text }: { text: string }) {
  return (
    <div className="flex flex-col h-full">
      <p className="text-sm font-semibold text-[#3b4a54] mb-3">Message preview</p>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[280px] rounded-2xl border-[8px] border-[#1f2c34] bg-[#efeae2] overflow-hidden shadow-lg">
          <div className="px-3 py-4">
            <div className="bg-white rounded-lg rounded-tl-sm shadow-md overflow-hidden">
              <p className="px-3 py-2.5 text-sm leading-relaxed text-[#111b21] whitespace-pre-wrap">
                {text}
              </p>
              <div className="border-t border-[#e9edef]">
                <div className="py-2.5 text-center text-sm font-medium text-[#008069]">Pay now</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const CreatePaymentRequestModal: React.FC<CreatePaymentRequestModalProps> = ({
  onClose,
  onCreated,
}) => {
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [contactId, setContactId] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Growth plan · Monthly subscription');
  const [sendMode, setSendMode] = useState<SendMode>('template');
  const [templateId, setTemplateId] = useState('');
  const [templateVariables, setTemplateVariables] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getContacts()
      .then((res) => {
        const list = Array.isArray(res)
          ? (res as ContactRow[])
          : ((res as { contacts?: ContactRow[] }).contacts ?? []);
        setContacts(list);
      })
      .catch(() => setContacts([]))
      .finally(() => setLoadingContacts(false));

    api
      .getTemplates()
      .then((rows: Record<string, unknown>[]) => {
        const mapped = rows.map((r) => mapTemplateFromApi(r));
        setTemplates(mapped);
        const growth = mapped.find((t) => t.name === 'growth_plan_payment' && t.status === 'Approved');
        const firstApproved = mapped.find((t) => t.status === 'Approved' && t.id);
        const pick = growth ?? firstApproved;
        if (pick?.id) setTemplateId(pick.id);
      })
      .catch(() => setTemplates([]))
      .finally(() => setLoadingTemplates(false));
  }, []);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId) ?? null,
    [templates, templateId]
  );

  const approvedTemplates = useMemo(
    () => templates.filter((t) => t.status === 'Approved' && t.id),
    [templates]
  );

  const varCount = selectedTemplate ? countBodyVariables(selectedTemplate.bodyPattern) : 0;
  const amountRupees = parseFloat(amount);
  const hasValidAmount = Number.isFinite(amountRupees) && amountRupees >= 1;
  const showPreview = Boolean(contactName.trim() && hasValidAmount && description.trim());

  useEffect(() => {
    if (sendMode !== 'template' || !selectedTemplate || !showPreview) return;
    const auto = buildPaymentTemplateVariables(contactName, description, amountRupees);
    setTemplateVariables((prev) => {
      const count = countBodyVariables(selectedTemplate.bodyPattern);
      if (count === 0) return [];
      return Array.from({ length: count }, (_, i) => {
        const existing = prev[i]?.trim();
        return existing || auto[i] || '';
      });
    });
  }, [
    sendMode,
    selectedTemplate?.id,
    selectedTemplate?.bodyPattern,
    contactName,
    description,
    amountRupees,
    showPreview,
  ]);

  const handleContactChange = (id: string) => {
    setContactId(id);
    const contact = contacts.find((c) => c.id === id);
    if (contact) {
      setContactName(contact.name);
      setContactPhone(contact.phone);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasValidAmount) {
      setError('Enter a valid amount (minimum ₹1)');
      return;
    }

    const name = contactName.trim();
    const phone = contactPhone.trim();
    const desc = description.trim();
    if (!name || !phone) {
      setError('Select or enter contact details');
      return;
    }
    if (!desc) {
      setError('Description is required');
      return;
    }
    if (sendMode === 'template') {
      if (!templateId) {
        setError('Select an approved WhatsApp template');
        return;
      }
      if (selectedTemplate?.status !== 'Approved') {
        setError('Only approved templates can be sent');
        return;
      }
      if (varCount > 0 && templateVariables.some((v) => !v.trim())) {
        setError('Fill in all template variables');
        return;
      }
    }

    setSubmitting(true);
    try {
      const created = await api.createWhatsAppPayRequest({
        ...(contactId ? { contactId } : {}),
        contactName: name,
        contactPhone: phone,
        amountPaise: Math.round(amountRupees * 100),
        description: desc,
        sendMode,
        ...(sendMode === 'template'
          ? {
              templateId,
              templateVariables: templateVariables.map((v) => v.trim()),
            }
          : {}),
      });
      await api.sendWhatsAppPayRequest(created.request.id);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create payment request');
    } finally {
      setSubmitting(false);
    }
  };

  const headerFormat = selectedTemplate
    ? headerFormatFromApi(selectedTemplate.headerFormat, Boolean(selectedTemplate.header))
    : 'none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden"
        role="dialog"
        aria-labelledby="create-payment-title"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 id="create-payment-title" className="text-lg font-black text-gray-900">
              New payment request
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Select contact and preview the WhatsApp message before sending
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-slate-100 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-1 min-h-0 flex-col">
          <div className="flex flex-1 min-h-0 flex-col lg:flex-row overflow-hidden">
            <div className="lg:w-[340px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-100 p-5 space-y-4 overflow-y-auto">
              <div>
                <label htmlFor="pay-contact" className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">
                  Contact
                </label>
                {loadingContacts ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading contacts…
                  </div>
                ) : (
                  <select
                    id="pay-contact"
                    value={contactId}
                    onChange={(e) => handleContactChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium cursor-pointer"
                  >
                    <option value="">Select a contact…</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} · {c.phone}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {!contactId && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="pay-name" className="text-xs font-bold text-gray-500 block mb-1">
                      Name
                    </label>
                    <input
                      id="pay-name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                      placeholder="Customer name"
                    />
                  </div>
                  <div>
                    <label htmlFor="pay-phone" className="text-xs font-bold text-gray-500 block mb-1">
                      Phone
                    </label>
                    <input
                      id="pay-phone"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                      placeholder="+91…"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="pay-amount" className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">
                  Amount (INR)
                </label>
                <input
                  id="pay-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                  placeholder="2499"
                  required
                />
              </div>

              <div>
                <label htmlFor="pay-desc" className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">
                  Description
                </label>
                <input
                  id="pay-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  placeholder="Growth plan · Monthly subscription"
                  maxLength={500}
                  required
                />
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  WhatsApp message
                </p>
                <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSendMode('template')}
                    className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                      sendMode === 'template'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Template
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendMode('plain')}
                    className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                      sendMode === 'plain'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Quick message
                  </button>
                </div>
              </div>

              {sendMode === 'template' && (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="pay-template" className="text-xs font-bold text-gray-500 block mb-1">
                      Template
                    </label>
                    {loadingTemplates ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading templates…
                      </div>
                    ) : approvedTemplates.length === 0 ? (
                      <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                        No approved templates. Submit a template from Templates first, or use Quick message.
                      </p>
                    ) : (
                      <select
                        id="pay-template"
                        value={templateId}
                        onChange={(e) => setTemplateId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm cursor-pointer"
                      >
                        {approvedTemplates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    )}
                    {selectedTemplate && (
                      <div className="mt-2 flex items-center gap-2">
                        <TemplateStatusBadge status={statusUiToSlug(selectedTemplate.status)} />
                        <span className="text-xs text-gray-500">{selectedTemplate.category}</span>
                      </div>
                    )}
                  </div>

                  {selectedTemplate && varCount > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Variables</p>
                      {Array.from({ length: varCount }, (_, i) => (
                        <label key={i} className="block">
                          <span className="text-xs font-semibold text-gray-600">{`{{${i + 1}}}`}</span>
                          <input
                            value={templateVariables[i] ?? ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              setTemplateVariables((prev) => {
                                const next = [...prev];
                                next[i] = v;
                                return next;
                              });
                            }}
                            className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 min-h-[280px] lg:min-h-0 bg-[#e5ddd5] p-4 overflow-y-auto">
              {!showPreview ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <MessageSquare className="w-10 h-10 text-[#667781] mb-3 opacity-60" />
                  <p className="text-sm font-bold text-[#3b4a54]">Preview will appear here</p>
                  <p className="text-xs text-[#667781] mt-1">
                    Select a contact, amount, and description to see the WhatsApp message
                  </p>
                </div>
              ) : sendMode === 'template' && selectedTemplate ? (
                <WhatsAppTemplatePreview
                  headerFormat={headerFormat}
                  header={selectedTemplate.header ?? ''}
                  headerMediaPreviewUrl={
                    selectedTemplate.headerMediaStorageKey
                      ? api.templateHeaderMediaUrl(selectedTemplate.headerMediaStorageKey)
                      : undefined
                  }
                  headerMediaFileName={selectedTemplate.headerMediaFileName}
                  body={selectedTemplate.bodyPattern}
                  footer={selectedTemplate.footer ?? ''}
                  variableSamples={templateVariables}
                  buttonType={
                    selectedTemplate.buttonType === 'URL' ||
                    selectedTemplate.buttonType === 'QUICK_REPLY' ||
                    selectedTemplate.buttonType === 'PHONE_NUMBER'
                      ? selectedTemplate.buttonType
                      : ''
                  }
                  buttonText={selectedTemplate.buttonText ?? ''}
                  languageLabel={selectedTemplate.language}
                  category={selectedTemplate.category}
                  templateName={selectedTemplate.name}
                />
              ) : (
                <PlainMessagePreview
                  text={buildPlainPaymentPreview(contactName, description, amountRupees)}
                />
              )}
            </div>
          </div>

          {error && (
            <p className="mx-5 mb-0 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2 shrink-0">
              {error}
            </p>
          )}

          <div className="flex gap-2 p-5 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !showPreview}
              className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending…
                </>
              ) : (
                'Create & send in WhatsApp'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
