/**
 * Meta Business Suite–style WhatsApp message template builder.
 * @license SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Loader2,
  Plus,
} from 'lucide-react';
import type { CampaignTemplate } from '../../types';
import { api } from '../../lib/api';
import { useSidebarOffset } from '../../contexts/SidebarContext';
import { WhatsAppTemplatePreview } from './WhatsAppTemplatePreview';
import {
  BODY_MAX,
  BUTTON_LABEL_MAX,
  FOOTER_MAX,
  HEADER_MAX,
  countBodyVariables,
  nextVariableIndex,
  sanitizeDisplayName,
} from './templateBuilderUtils';

const LANGUAGE_OPTIONS = [
  { value: 'en_US', label: 'English (US)' },
  { value: 'en_GB', label: 'English (UK)' },
  { value: 'en', label: 'English (maps to en_US)' },
  { value: 'hi', label: 'Hindi' },
  { value: 'es', label: 'Spanish' },
  { value: 'pt_BR', label: 'Portuguese (BR)' },
];

const CATEGORIES: {
  value: CampaignTemplate['category'];
  title: string;
  desc: string;
}[] = [
  {
    value: 'Marketing',
    title: 'Marketing',
    desc: 'Promotions, offers, updates, or invitations for customers to respond or take action.',
  },
  {
    value: 'Utility',
    title: 'Utility',
    desc: 'Account updates, order updates, alerts, or general information requests.',
  },
  {
    value: 'Authentication',
    title: 'Authentication',
    desc: 'One-time passwords or verification codes for account access.',
  },
];

type Props = {
  template: CampaignTemplate | null;
  onBack: () => void;
  onSaved: () => void;
};

function Section({
  title,
  subtitle,
  children,
  defaultOpen = true,
  className = '',
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className={`bg-white rounded-lg border border-[#dadde1] shadow-sm overflow-hidden ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-[#f7f8fa] transition-colors"
      >
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[#1c2b33]">{title}</h3>
          {subtitle && open && (
            <p className="text-meta text-[#65676b] mt-0.5 leading-snug truncate">{subtitle}</p>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-[#65676b] shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#65676b] shrink-0" />
        )}
      </button>
      {open && <div className="px-4 pb-3 border-t border-[#e4e6eb]">{children}</div>}
    </div>
  );
}

export const WhatsAppTemplateBuilder: React.FC<Props> = ({
  template,
  onBack,
  onSaved,
}) => {
  const isEdit = Boolean(template?.id);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<CampaignTemplate['category']>('Utility');
  const [language, setLanguage] = useState('en_US');
  const [headerFormat, setHeaderFormat] = useState<'none' | 'text'>('none');
  const [header, setHeader] = useState('');
  const [bodyPattern, setBodyPattern] = useState('');
  const [footer, setFooter] = useState('');
  const [buttonKind, setButtonKind] = useState<'none' | 'QUICK_REPLY' | 'URL'>('none');
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [variableSamples, setVariableSamples] = useState<string[]>([]);
  const [submitToMeta, setSubmitToMeta] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const varCount = useMemo(() => countBodyVariables(bodyPattern), [bodyPattern]);
  const languageLabel =
    LANGUAGE_OPTIONS.find((l) => l.value === language)?.label ?? language;

  useEffect(() => {
    if (template) {
      setName(template.name);
      setCategory(template.category);
      setLanguage(template.language || 'en_US');
      setHeaderFormat(template.header ? 'text' : 'none');
      setHeader(template.header || '');
      setBodyPattern(template.bodyPattern);
      setFooter(template.footer || '');
      const bt = template.buttonType as 'QUICK_REPLY' | 'URL' | undefined;
      setButtonKind(bt || 'none');
      setButtonText(template.buttonText || '');
      setButtonUrl(template.buttonUrl || '');
      setVariableSamples(template.variables?.length ? [...template.variables] : []);
      setSubmitToMeta(false);
    } else {
      setName('');
      setCategory('Utility');
      setLanguage('en_US');
      setHeaderFormat('none');
      setHeader('');
      setBodyPattern('Hello {{1}}, thank you for your order {{2}}.');
      setFooter('');
      setButtonKind('none');
      setButtonText('');
      setButtonUrl('');
      setVariableSamples(['John', 'ORD-12345']);
      setSubmitToMeta(true);
    }
    setError('');
  }, [template]);

  useEffect(() => {
    if (varCount === 0) {
      setVariableSamples([]);
      return;
    }
    setVariableSamples((prev) => {
      const next = [...prev];
      while (next.length < varCount) next.push(`Sample ${next.length + 1}`);
      return next.slice(0, varCount);
    });
  }, [varCount]);

  const insertVariable = () => {
    const idx = nextVariableIndex(bodyPattern);
    const token = `{{${idx}}}`;
    const el = bodyRef.current;
    if (el) {
      const start = el.selectionStart ?? bodyPattern.length;
      const end = el.selectionEnd ?? bodyPattern.length;
      const next = bodyPattern.slice(0, start) + token + bodyPattern.slice(end);
      if (next.length <= BODY_MAX) setBodyPattern(next);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + token.length;
        el.setSelectionRange(pos, pos);
      });
      return;
    }
    if ((bodyPattern + token).length <= BODY_MAX) setBodyPattern((b) => b + token);
  };

  const handleSave = async (asDraft: boolean) => {
    setSaving(true);
    setError('');
    const safeName = sanitizeDisplayName(name);
    if (!safeName) {
      setError('Enter a valid template name (letters, numbers, underscores).');
      setSaving(false);
      return;
    }
    if (!bodyPattern.trim()) {
      setError('Message body is required.');
      setSaving(false);
      return;
    }

    const payload = {
      name: safeName,
      category,
      language,
      bodyPattern: bodyPattern.trim(),
      header: headerFormat === 'text' && header.trim() ? header.trim() : null,
      footer: footer.trim() || null,
      variables: variableSamples,
      variableSamples,
      buttonType: buttonKind === 'none' ? null : buttonKind,
      buttonText: buttonKind === 'none' ? null : buttonText.trim() || null,
      buttonUrl: buttonKind === 'URL' ? buttonUrl.trim() || null : null,
      submitToMeta: asDraft ? false : submitToMeta,
    };

    try {
      if (isEdit && template?.id) {
        await api.updateTemplate(template.id, payload);
        if (!asDraft && submitToMeta && template.status !== 'Approved') {
          await api.submitTemplate(template.id);
        }
      } else {
        await api.createTemplate(payload);
      }
      onSaved();
      onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save template');
    } finally {
      setSaving(false);
    }
  };

  const nameLocked = isEdit && template?.status === 'Approved';
  const displayName = sanitizeDisplayName(name) || 'name_will_appear_here';
  const sidebarOffset = useSidebarOffset();

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#f0f2f5] transition-[left] duration-200 ease-out"
      style={{ left: sidebarOffset }}
    >
      <header className="bg-white border-b border-[#dadde1] px-5 py-2.5 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-full hover:bg-[#f0f2f5] text-[#050505] transition-colors"
            aria-label="Back to templates"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-[#050505] truncate">
              {isEdit ? 'Edit message template' : 'Create message template'}
            </h1>
            <p className="text-sm text-[#65676b] truncate">
              WhatsApp Manager · Submit to Meta for approval
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={saving || nameLocked}
            onClick={() => handleSave(true)}
            className="px-4 py-2 text-sm font-semibold text-[#050505] bg-[#e4e6eb] hover:bg-[#d8dadf] rounded-lg disabled:opacity-50"
          >
            Save as draft
          </button>
          <button
            type="button"
            disabled={saving || nameLocked}
            onClick={() => handleSave(false)}
            className="px-4 py-2 text-sm font-semibold text-white bg-[#008069] hover:bg-[#006e5b] rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitToMeta ? 'Submit template' : 'Save'}
          </button>
        </div>
      </header>

      {error && (
        <div className="mx-5 mt-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm font-medium text-red-700 shrink-0">
          {error}
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 overflow-y-auto px-5 py-4">
          <div className="max-w-[1100px] mx-auto space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Section title="Category" subtitle="Marketing, utility, or authentication">
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-2">
                  {CATEGORIES.map((c) => (
                    <label
                      key={c.value}
                      className={`flex flex-col gap-1.5 p-2.5 rounded-lg border-2 cursor-pointer transition-all h-full ${
                        category === c.value
                          ? 'border-[#008069] bg-[#e7f5f0]'
                          : 'border-[#e4e6eb] bg-white hover:border-[#bcc0c4]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="category"
                          checked={category === c.value}
                          onChange={() => setCategory(c.value)}
                          className="accent-[#008069]"
                        />
                        <p className="text-sm font-semibold text-[#050505]">{c.title}</p>
                      </div>
                      <p className="text-meta text-[#65676b] leading-snug pl-5">{c.desc}</p>
                    </label>
                  ))}
                </div>
              </Section>

              <Section title="Name and language">
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-1 text-meta font-semibold text-[#050505] mb-1">
                      Template name
                      <HelpCircle
                        className="w-3.5 h-3.5 text-[#65676b]"
                        title="Lowercase letters, numbers and underscores only"
                      />
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => setName(sanitizeDisplayName(name) || name)}
                      disabled={nameLocked}
                      placeholder="e.g. order_confirmation"
                      className="w-full border border-[#ccd0d5] rounded-lg px-3 py-2 text-sm font-mono text-[#050505] outline-none focus:border-[#008069] disabled:bg-[#f0f2f5]"
                    />
                    <p className="text-meta text-[#65676b] mt-1 font-mono">{displayName}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-meta font-semibold text-[#050505] mb-1">
                      Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full border border-[#ccd0d5] rounded-lg px-3 py-2 text-sm text-[#050505] outline-none focus:border-[#008069] bg-white"
                    >
                      {LANGUAGE_OPTIONS.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </Section>
            </div>

            <Section title="Content" subtitle="Header, body, footer and buttons">
              <div className="pt-2 grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-6">
                <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-[#050505] mb-2">
                  Header <span className="font-normal text-[#65676b]">· Optional</span>
                </label>
                <select
                  value={headerFormat}
                  onChange={(e) => {
                    const v = e.target.value as 'none' | 'text';
                    setHeaderFormat(v);
                    if (v === 'none') setHeader('');
                  }}
                  className="w-full border border-[#ccd0d5] rounded-lg px-3 py-2 text-sm mb-2 bg-white"
                >
                  <option value="none">None</option>
                  <option value="text">Text</option>
                </select>
                {headerFormat === 'text' && (
                  <input
                    value={header}
                    onChange={(e) => setHeader(e.target.value.slice(0, HEADER_MAX))}
                    placeholder="Add a short header"
                    maxLength={HEADER_MAX}
                    className="w-full border border-[#ccd0d5] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#008069]"
                  />
                )}
              </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-meta font-semibold text-[#050505]">
                        Body <span className="text-[#e41e3f]">*</span>
                      </label>
                      <span className="text-meta text-[#65676b]">
                        {bodyPattern.length}/{BODY_MAX}
                      </span>
                    </div>
                    <textarea
                      ref={bodyRef}
                      value={bodyPattern}
                      onChange={(e) => setBodyPattern(e.target.value.slice(0, BODY_MAX))}
                      rows={8}
                      placeholder="Write your message. Use {{1}}, {{2}} for variables."
                      className="w-full border border-[#ccd0d5] rounded-lg px-3 py-2 text-sm leading-relaxed outline-none focus:border-[#008069] resize-none min-h-[160px]"
                    />
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={insertVariable}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-meta font-semibold text-[#008069] border border-[#008069] rounded-md hover:bg-[#e7f5f0]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add variable
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-meta font-semibold text-[#050505] mb-1">
                        Footer <span className="font-normal text-[#65676b]">· Optional</span>
                      </label>
                      <input
                        value={footer}
                        onChange={(e) => setFooter(e.target.value.slice(0, FOOTER_MAX))}
                        maxLength={FOOTER_MAX}
                        placeholder="Reply STOP to unsubscribe"
                        className="w-full border border-[#ccd0d5] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#008069]"
                      />
                    </div>
                    <div>
                      <label className="block text-meta font-semibold text-[#050505] mb-1">
                        Buttons <span className="font-normal text-[#65676b]">· Optional</span>
                      </label>
                      <select
                        value={buttonKind}
                        onChange={(e) => {
                          const v = e.target.value as typeof buttonKind;
                          setButtonKind(v);
                          if (v === 'none') {
                            setButtonText('');
                            setButtonUrl('');
                          }
                        }}
                        className="w-full border border-[#ccd0d5] rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-[#008069]"
                      >
                        <option value="none">None</option>
                        <option value="QUICK_REPLY">Quick reply</option>
                        <option value="URL">Visit website</option>
                      </select>
                    </div>
                  </div>

                  {buttonKind !== 'none' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-meta font-semibold text-[#65676b] mb-1">
                          Button text
                        </label>
                        <input
                          value={buttonText}
                          onChange={(e) =>
                            setButtonText(e.target.value.slice(0, BUTTON_LABEL_MAX))
                          }
                          maxLength={BUTTON_LABEL_MAX}
                          placeholder="View order"
                          className="w-full border border-[#ccd0d5] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#008069]"
                        />
                      </div>
                      {buttonKind === 'URL' && (
                        <div>
                          <label className="block text-meta font-semibold text-[#65676b] mb-1">
                            Website URL
                          </label>
                          <input
                            value={buttonUrl}
                            onChange={(e) => setButtonUrl(e.target.value)}
                            placeholder="https://www.example.com"
                            className="w-full border border-[#ccd0d5] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#008069]"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {varCount > 0 && (
                    <div className="p-3 bg-[#f7f8fa] rounded-lg border border-[#e4e6eb] space-y-2 h-fit">
                      <p className="text-meta font-semibold text-[#050505]">Variable samples</p>
                      <p className="text-meta text-[#65676b]">
                        Shown in preview and sent to Meta for review.
                      </p>
                      {variableSamples.map((sample, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-12 text-meta font-mono font-semibold text-[#008069]">
                            {`{{${i + 1}}}`}
                          </span>
                          <input
                            value={sample}
                            onChange={(e) => {
                              const next = [...variableSamples];
                              next[i] = e.target.value;
                              setVariableSamples(next);
                            }}
                            className="flex-1 border border-[#ccd0d5] rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#008069]"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {!nameLocked && (
                    <label className="flex items-start gap-3 p-3 bg-[#f7f8fa] rounded-lg border border-[#e4e6eb] cursor-pointer h-fit">
                      <input
                        type="checkbox"
                        checked={submitToMeta}
                        onChange={(e) => setSubmitToMeta(e.target.checked)}
                        className="mt-0.5 accent-[#008069]"
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#050505]">
                          Submit to Meta for review
                        </p>
                        <p className="text-meta text-[#65676b] mt-0.5 leading-snug">
                          Sends to WhatsApp after save. Review can take up to 24 hours.
                        </p>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </Section>
          </div>
        </div>

        <aside className="w-[min(42vw,520px)] shrink-0 border-l border-[#c5b9a8] bg-[#e5ddd5] px-6 py-5 flex flex-col min-h-0 overflow-hidden">
          <WhatsAppTemplatePreview
            headerFormat={headerFormat}
            header={header}
            body={bodyPattern}
            footer={footer}
            variableSamples={variableSamples}
            buttonType={buttonKind === 'none' ? '' : buttonKind}
            buttonText={buttonText}
            languageLabel={languageLabel}
            category={category}
            templateName={displayName}
          />
        </aside>
      </div>
    </div>
  );
};
