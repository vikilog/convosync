/**
 * Meta Business Suite–style WhatsApp message template builder.
 * @license SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  LayoutGrid,
  Loader2,
  Pencil,
  Phone,
  Plus,
  Reply,
  Trash2,
  Type,
  Upload,
  Video,
  X,
} from 'lucide-react';
import type { CampaignTemplate } from '../../types';
import { api } from '../../lib/api';
import { useSidebarOffset } from '../../contexts/SidebarContext';
import { WhatsAppTemplatePreview } from './WhatsAppTemplatePreview';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  BODY_MAX,
  BUTTON_LABEL_MAX,
  FOOTER_MAX,
  HEADER_MAX,
  HEADER_MEDIA_ACCEPT,
  HEADER_MEDIA_HINT,
  countBodyVariables,
  headerFormatFromApi,
  headerFormatToApi,
  nextVariableIndex,
  sanitizeDisplayName,
  assertValidTemplateName,
  isUrlLikeName,
  type ButtonKind,
  type HeaderFormat,
} from './templateBuilderUtils';
const LANGUAGE_OPTIONS = [
  { value: 'en_US', label: 'English (US) · en_US' },
  { value: 'en', label: 'English · en' },
  { value: 'en_GB', label: 'English (UK) · en_GB' },
  { value: 'hi', label: 'Hindi · hi' },
  { value: 'es', label: 'Spanish · es' },
  { value: 'pt_BR', label: 'Portuguese (BR) · pt_BR' },
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

const HEADER_OPTIONS: {
  value: HeaderFormat;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: 'none', label: 'None', icon: <X className="w-4 h-4" /> },
  { value: 'text', label: 'Text', icon: <Type className="w-4 h-4" /> },
  { value: 'image', label: 'Image', icon: <ImageIcon className="w-4 h-4" /> },
  { value: 'video', label: 'Video', icon: <Video className="w-4 h-4" /> },
  { value: 'document', label: 'Document', icon: <FileText className="w-4 h-4" /> },
];

const BUTTON_OPTIONS: {
  value: Exclude<ButtonKind, 'none'>;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'QUICK_REPLY',
    label: 'Quick reply',
    desc: 'Send a preset reply back to you',
    icon: <Reply className="w-4 h-4" />,
  },
  {
    value: 'URL',
    label: 'Visit website',
    desc: 'Open a link in the browser',
    icon: <ExternalLink className="w-4 h-4" />,
  },
  {
    value: 'PHONE_NUMBER',
    label: 'Call phone number',
    desc: 'Dial a phone number',
    icon: <Phone className="w-4 h-4" />,
  },
  {
    value: 'FLOW',
    label: 'Open a Flow',
    desc: 'Open a WhatsApp Flow form — works outside the 24h chat window',
    icon: <LayoutGrid className="w-4 h-4" />,
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
      className={`bg-white rounded-xl border border-swiss-line ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-surface-muted transition-colors"
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
      {open && <div className="px-4 pb-3 border-t border-swiss-line">{children}</div>}
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const buttonsSectionRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<CampaignTemplate['category']>('Utility');
  const [language, setLanguage] = useState('en_US');
  const [headerFormat, setHeaderFormat] = useState<HeaderFormat>('none');
  const [header, setHeader] = useState('');
  const [headerMediaHandle, setHeaderMediaHandle] = useState('');
  const [headerMediaStorageKey, setHeaderMediaStorageKey] = useState('');
  const [headerMediaMimeType, setHeaderMediaMimeType] = useState('');
  const [headerMediaFileName, setHeaderMediaFileName] = useState('');
  const [headerMediaPreviewUrl, setHeaderMediaPreviewUrl] = useState('');
  const [localMediaPreviewUrl, setLocalMediaPreviewUrl] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [bodyPattern, setBodyPattern] = useState('');
  const [footer, setFooter] = useState('');
  const [buttonKind, setButtonKind] = useState<ButtonKind>('none');
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [buttonPhone, setButtonPhone] = useState('');
  const [buttonUrlSample, setButtonUrlSample] = useState('sample_payment_id');
  const [buttonFlowId, setButtonFlowId] = useState('');
  const [publishedFlows, setPublishedFlows] = useState<Array<{ id: string; name: string }>>([]);
  const [showButtonMenu, setShowButtonMenu] = useState(false);
  const [variableSamples, setVariableSamples] = useState<string[]>([]);
  const [submitToMeta, setSubmitToMeta] = useState(true);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState('');
  // Unsaved-changes guard for the back button. Compares current field
  // values against a snapshot of what hydration just set them to, rather
  // than a "did hydration just run" flag — the hydration effect's setState
  // calls land over one or more extra render passes, so a flag consumed on
  // the first post-hydration effect run fires too early (before the
  // hydrated values have actually settled) and falsely marks a freshly
  // loaded template as dirty.
  const [isDirty, setIsDirty] = useState(false);
  const hydratedSnapshotRef = useRef('');

  const varCount = useMemo(() => countBodyVariables(bodyPattern), [bodyPattern]);
  const languageOptions = useMemo(() => {
    if (LANGUAGE_OPTIONS.some((l) => l.value === language)) return LANGUAGE_OPTIONS;
    return [...LANGUAGE_OPTIONS, { value: language, label: language }];
  }, [language]);
  const languageLabel =
    languageOptions.find((l) => l.value === language)?.label ?? language;

  const previewMediaUrl = localMediaPreviewUrl || headerMediaPreviewUrl;

  useEffect(() => {
    return () => {
      if (localMediaPreviewUrl) URL.revokeObjectURL(localMediaPreviewUrl);
    };
  }, [localMediaPreviewUrl]);

  useEffect(() => {
    if (buttonKind !== 'FLOW') return;
    let cancelled = false;
    api
      .listWhatsAppFlows()
      .then((res: { items?: Array<{ id: string; name: string; status: string }> }) => {
        if (!cancelled) {
          setPublishedFlows((res.items ?? []).filter((f) => f.status === 'published'));
        }
      })
      .catch(() => {
        if (!cancelled) setPublishedFlows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [buttonKind]);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setCategory(template.category);
      setLanguage(template.language || 'en_US');
      setHeaderFormat(
        headerFormatFromApi(template.headerFormat, Boolean(template.header))
      );
      setHeader(template.header || '');
      setHeaderMediaStorageKey(template.headerMediaStorageKey || '');
      setHeaderMediaMimeType(template.headerMediaMimeType || '');
      setHeaderMediaFileName(template.headerMediaFileName || '');
      setHeaderMediaPreviewUrl(
        template.headerMediaStorageKey
          ? api.templateHeaderMediaUrl(template.headerMediaStorageKey)
          : ''
      );
      setHeaderMediaHandle('');
      setLocalMediaPreviewUrl('');
      setBodyPattern(template.bodyPattern);
      setFooter(template.footer || '');
      const bt = template.buttonType as ButtonKind | undefined;
      setButtonKind(bt && bt !== 'none' ? bt : 'none');
      setButtonText(template.buttonText || '');
      setButtonUrl(template.buttonUrl || '');
      setButtonPhone(template.buttonPhoneNumber || '');
      setButtonUrlSample('sample_payment_id');
      setButtonFlowId(template.buttonFlowId || '');
      setVariableSamples(template.variables?.length ? [...template.variables] : []);
      setSubmitToMeta(false);
    } else {
      setName('');
      setCategory('Utility');
      setLanguage('en_US');
      setHeaderFormat('none');
      setHeader('');
      clearMediaState();
      setBodyPattern('Hello {{1}}, thank you for your order {{2}}.');
      setFooter('');
      setButtonKind('none');
      setButtonText('');
      setButtonUrl('');
      setButtonPhone('');
      setButtonUrlSample('sample_payment_id');
      setButtonFlowId('');
      setVariableSamples(['John', 'ORD-12345']);
      setSubmitToMeta(true);
    }
    setError('');
    setMediaError('');

    // Mirrors exactly what the branches above just set, computed straight
    // from `template` rather than read back from state — the state won't
    // reflect these values until a later render, but this snapshot is
    // correct immediately.
    const bt = template?.buttonType as ButtonKind | undefined;
    hydratedSnapshotRef.current = JSON.stringify(
      template
        ? {
            name: template.name,
            category: template.category,
            language: template.language || 'en_US',
            headerFormat: headerFormatFromApi(template.headerFormat, Boolean(template.header)),
            header: template.header || '',
            headerMediaHandle: '',
            headerMediaStorageKey: template.headerMediaStorageKey || '',
            bodyPattern: template.bodyPattern,
            footer: template.footer || '',
            buttonKind: bt && bt !== 'none' ? bt : 'none',
            buttonText: template.buttonText || '',
            buttonUrl: template.buttonUrl || '',
            buttonPhone: template.buttonPhoneNumber || '',
            buttonFlowId: template.buttonFlowId || '',
            variableSamples: template.variables?.length ? [...template.variables] : [],
          }
        : {
            name: '',
            category: 'Utility',
            language: 'en_US',
            headerFormat: 'none',
            header: '',
            headerMediaHandle: '',
            headerMediaStorageKey: '',
            bodyPattern: 'Hello {{1}}, thank you for your order {{2}}.',
            footer: '',
            buttonKind: 'none',
            buttonText: '',
            buttonUrl: '',
            buttonPhone: '',
            buttonFlowId: '',
            variableSamples: ['John', 'ORD-12345'],
          }
    );
    setIsDirty(false);
  }, [template]);

  useEffect(() => {
    const current = JSON.stringify({
      name,
      category,
      language,
      headerFormat,
      header,
      headerMediaHandle,
      headerMediaStorageKey,
      bodyPattern,
      footer,
      buttonKind,
      buttonText,
      buttonUrl,
      buttonPhone,
      buttonFlowId,
      variableSamples,
    });
    setIsDirty(current !== hydratedSnapshotRef.current);
  }, [
    name,
    category,
    language,
    headerFormat,
    header,
    headerMediaHandle,
    headerMediaStorageKey,
    bodyPattern,
    footer,
    buttonKind,
    buttonText,
    buttonUrl,
    buttonPhone,
    buttonFlowId,
    variableSamples,
  ]);

  function clearMediaState() {
    setHeaderMediaHandle('');
    setHeaderMediaStorageKey('');
    setHeaderMediaMimeType('');
    setHeaderMediaFileName('');
    setHeaderMediaPreviewUrl('');
    setLocalMediaPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
  }

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

  const selectHeaderFormat = (format: HeaderFormat) => {
    setHeaderFormat(format);
    setMediaError('');
    if (format === 'none' || format === 'text') {
      clearMediaState();
      if (format === 'none') setHeader('');
    } else {
      setHeader('');
      clearMediaState();
    }
  };

  const handleMediaFile = async (file: File) => {
    if (headerFormat !== 'image' && headerFormat !== 'video' && headerFormat !== 'document') {
      return;
    }
    setMediaError('');
    setUploadingMedia(true);
    setLocalMediaPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    try {
      const res = await api.uploadTemplateHeaderMedia(file);
      setHeaderMediaHandle(res.headerMediaHandle);
      setHeaderMediaStorageKey(res.headerMediaStorageKey);
      setHeaderMediaMimeType(res.headerMediaMimeType);
      setHeaderMediaFileName(res.headerMediaFileName || file.name);
      setHeaderMediaPreviewUrl(api.templateHeaderMediaUrl(res.headerMediaStorageKey));
    } catch (err) {
      setMediaError(err instanceof Error ? err.message : 'Media upload failed');
      clearMediaState();
    } finally {
      setUploadingMedia(false);
    }
  };

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

  const addButton = (kind: Exclude<ButtonKind, 'none'>) => {
    setButtonKind(kind);
    setShowButtonMenu(false);
    if (kind === 'QUICK_REPLY') {
      setButtonUrl('');
      setButtonPhone('');
    } else if (kind === 'URL') {
      setButtonPhone('');
    } else if (kind === 'FLOW') {
      setButtonUrl('');
      setButtonPhone('');
    } else {
      setButtonUrl('');
    }
    requestAnimationFrame(() => {
      buttonsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };

  useEffect(() => {
    if (!showButtonMenu) return;
    requestAnimationFrame(() => {
      buttonsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, [showButtonMenu]);

  const removeButton = () => {
    setButtonKind('none');
    setButtonText('');
    setButtonUrl('');
    setButtonPhone('');
  };

  const handleSave = async (asDraft: boolean) => {
    // The Save/Submit button's disabled state lags a tick behind a fast
    // double-click — this ref rejects the second invocation synchronously.
    if (savingRef.current) return;

    const willSubmitToMeta = !asDraft && submitToMeta && !contentLocked;
    if (
      willSubmitToMeta &&
      !window.confirm(
        "Submit this template to Meta for review? This can't be undone, and review can take up to 24 hours."
      )
    ) {
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setError('');

    try {
      // Meta locks approved content; only local language can be corrected for send.
      if (isEdit && template?.id && template.status === 'Approved') {
        try {
          await api.updateTemplate(template.id, { language });
          onSaved();
          onBack();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Could not save template');
        }
        return;
      }

      let safeName: string;
      try {
        safeName = assertValidTemplateName(name);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Enter a valid template name.');
        return;
      }
      if (!bodyPattern.trim()) {
        setError('Message body is required.');
        return;
      }
      if (
        (headerFormat === 'image' || headerFormat === 'video' || headerFormat === 'document') &&
        !headerMediaHandle &&
        !headerMediaStorageKey
      ) {
        setError('Upload a sample file for the media header.');
        return;
      }
      if (buttonKind === 'URL' && !buttonUrl.trim()) {
        setError('Enter a website URL for the button.');
        return;
      }
      if (buttonKind === 'PHONE_NUMBER' && !buttonPhone.trim()) {
        setError('Enter a phone number for the call button.');
        return;
      }
      if (buttonKind === 'FLOW' && !buttonFlowId.trim()) {
        setError('Select a published flow for the button.');
        return;
      }
      if (buttonKind !== 'none' && !buttonText.trim()) {
        setError('Enter button label text.');
        return;
      }

      const apiHeaderFormat = headerFormatToApi(headerFormat);
      const payload = {
        name: safeName,
        category,
        language,
        bodyPattern: bodyPattern.trim(),
        header: headerFormat === 'text' && header.trim() ? header.trim() : null,
        headerFormat: apiHeaderFormat,
        headerMediaHandle: headerMediaHandle || null,
        headerMediaStorageKey: headerMediaStorageKey || null,
        headerMediaMimeType: headerMediaMimeType || null,
        headerMediaFileName: headerMediaFileName || null,
        footer: footer.trim() || null,
        variables: variableSamples,
        variableSamples,
        buttonType: buttonKind === 'none' ? null : buttonKind,
        buttonText: buttonKind === 'none' ? null : buttonText.trim() || null,
        buttonUrl: buttonKind === 'URL' ? buttonUrl.trim() || null : null,
        buttonPhoneNumber: buttonKind === 'PHONE_NUMBER' ? buttonPhone.trim() || null : null,
        buttonFlowId: buttonKind === 'FLOW' ? buttonFlowId.trim() || null : null,
        buttonUrlSample:
          buttonKind === 'URL' && /\{\{\d+\}\}/.test(buttonUrl)
            ? buttonUrlSample.trim() || 'sample_link_id'
            : null,
        submitToMeta: asDraft ? false : submitToMeta,
      };

      try {
        if (isEdit && template?.id) {
          await api.updateTemplate(template.id, payload);
          if (!asDraft && submitToMeta) {
            await api.submitTemplate(template.id);
          }
        } else {
          await api.createTemplate(payload);
        }
        setIsDirty(false);
        onSaved();
        onBack();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save template');
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (isDirty && !window.confirm('Discard unsaved changes to this template?')) return;
    onBack();
  };

  const contentLocked = isEdit && template?.status === 'Approved';
  const nameLocked = contentLocked;
  const displayName = sanitizeDisplayName(name) || 'name_will_appear_here';
  const sidebarOffset = useSidebarOffset();
  const isMediaHeader =
    headerFormat === 'image' || headerFormat === 'video' || headerFormat === 'document';

  return (
    <div
      className="fixed inset-0 z-50 flex h-dvh flex-col overflow-hidden bg-white font-swiss transition-[left] duration-200 ease-out"
      style={{ left: sidebarOffset }}
    >
      <header className="bg-white border-b border-swiss-line px-5 py-2.5 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-surface-muted text-[#050505] transition-colors"
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
          {!contentLocked && (
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(true)}
              className="px-4 py-2 text-sm font-semibold text-[#050505] bg-white hover:bg-black/[0.06] border border-swiss-line rounded-lg disabled:opacity-50"
            >
              Save as draft
            </button>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(false)}
            className="px-4 py-2 text-sm font-semibold text-white bg-swiss-accent hover:bg-swiss-accent-hover rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {contentLocked
              ? 'Save language'
              : submitToMeta
                ? 'Submit template'
                : 'Save'}
          </button>
        </div>
      </header>

      {error && (
        <div className="mx-5 mt-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm font-medium text-red-700 shrink-0">
          {error}
        </div>
      )}

      {contentLocked && (
        <div className="mx-5 mt-2 px-4 py-2.5 bg-sky-50 border border-sky-200 rounded-lg text-sm text-sky-950 shrink-0">
          <strong>Approved on Meta:</strong> content is locked. You can fix the{' '}
          <strong>language code</strong> so campaigns/sends match Meta (e.g. <code>en</code> vs{' '}
          <code>en_US</code>). Or use <strong>Fetch from Meta</strong> to refresh language from Meta.
        </div>
      )}

      {!contentLocked && !submitToMeta && (
        <div className="mx-5 mt-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900 shrink-0">
          <strong>Draft only:</strong> This template will stay in ConvoSync and will{' '}
          <strong>not appear in Meta WhatsApp Manager</strong> until you submit it. Use{' '}
          <strong>Submit template</strong> or enable &quot;Submit to Meta for review&quot; below.
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4 pb-12">
          <div className="mx-auto max-w-[1100px] space-y-3">
            <div className="flex flex-col gap-3">
              <Section title="Category" subtitle="Choose how Meta classifies this template">
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((c) => (
                    <label
                      key={c.value}
                      className={`flex flex-col gap-1.5 rounded-lg border-2 p-3 transition-colors duration-200 h-full ${
                        contentLocked
                          ? 'cursor-not-allowed opacity-70'
                          : 'cursor-pointer'
                      } ${
                        category === c.value
                          ? 'border-swiss-accent bg-swiss-accent/10'
                          : 'border-swiss-line bg-white hover:border-swiss-accent/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="category"
                          checked={category === c.value}
                          onChange={() => setCategory(c.value)}
                          disabled={contentLocked}
                          className="accent-swiss-accent cursor-pointer disabled:cursor-not-allowed"
                        />
                        <p className="text-sm font-semibold text-[#050505]">{c.title}</p>
                      </div>
                      <p className="text-meta text-[#65676b] leading-snug pl-5">{c.desc}</p>
                    </label>
                  ))}
                </div>
              </Section>

              <Section title="Name and language" subtitle="How this template appears in Meta">
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="wa-tpl-name"
                      className="mb-1 flex items-center gap-1 text-meta font-semibold text-[#050505]"
                    >
                      Template name
                      <HelpCircle
                        className="w-3.5 h-3.5 text-[#65676b]"
                        title="Lowercase letters, numbers and underscores only"
                      />
                    </label>
                    <Input
                      id="wa-tpl-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => {
                        if (isUrlLikeName(name)) return;
                        setName(sanitizeDisplayName(name) || name);
                      }}
                      disabled={nameLocked}
                      placeholder="e.g. order_confirmation"
                      className="h-auto w-full rounded-lg border border-swiss-line bg-white px-3 py-2.5 font-mono text-sm text-[#050505] outline-none transition-colors focus:border-swiss-accent focus:ring-2 focus:ring-swiss-accent/15 disabled:opacity-60"
                    />
                    <p className="mt-1 font-mono text-meta text-[#65676b]">{displayName}</p>
                    {isUrlLikeName(name) && (
                      <p className="mt-1 text-meta text-red-600">
                        Name cannot be a URL. Use letters, numbers, and underscores only.
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="wa-tpl-language"
                      className="mb-1 block text-meta font-semibold text-[#050505]"
                    >
                      Language
                    </label>
                    <select
                      id="wa-tpl-language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full cursor-pointer rounded-lg border border-swiss-line bg-white px-3 py-2.5 text-sm text-[#050505] outline-none transition-colors focus:border-swiss-accent focus:ring-2 focus:ring-swiss-accent/15"
                    >
                      {languageOptions.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-meta text-[#65676b]">
                      Must match Meta exactly (<code className="font-mono">{language}</code>).{' '}
                      <code className="font-mono">en</code> and <code className="font-mono">en_US</code>{' '}
                      are different templates.
                    </p>
                  </div>
                </div>
              </Section>
            </div>

            <Section title="Content" subtitle="Header, body, footer and buttons">
              <fieldset
                disabled={contentLocked}
                className={`pt-2 grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-6 border-0 p-0 m-0 min-w-0 ${
                  contentLocked ? 'opacity-60' : ''
                }`}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#050505] mb-2">
                      Header <span className="font-normal text-[#65676b]">· Optional</span>
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {HEADER_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => selectHeaderFormat(opt.value)}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                            headerFormat === opt.value
                              ? 'border-swiss-accent bg-swiss-accent/10 text-swiss-accent'
                              : 'border-black/10 bg-white text-[#050505] hover:border-swiss-accent/50'
                          }`}
                        >
                          {opt.icon}
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {headerFormat === 'text' && (
                      <Input
                        value={header}
                        onChange={(e) => setHeader(e.target.value.slice(0, HEADER_MAX))}
                        placeholder="Add a short header line"
                        maxLength={HEADER_MAX}
                        className="h-auto w-full border border-swiss-line bg-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-swiss-accent focus:ring-2 focus:ring-swiss-accent/15"
                      />
                    )}

                    {isMediaHeader && (
                      <div className="space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept={HEADER_MEDIA_ACCEPT[headerFormat]}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void handleMediaFile(file);
                            e.target.value = '';
                          }}
                        />
                        {previewMediaUrl ? (
                          <div className="rounded-lg border border-swiss-line bg-white p-3 space-y-3">
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                disabled={uploadingMedia}
                                onClick={() => fileInputRef.current?.click()}
                                className="group relative flex h-24 w-32 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-black/5 disabled:opacity-60"
                                aria-label={`Edit header ${headerFormat}`}
                              >
                                {uploadingMedia ? (
                                  <Loader2 className="w-6 h-6 animate-spin text-swiss-accent" />
                                ) : headerFormat === 'image' ? (
                                  <img
                                    src={previewMediaUrl}
                                    alt="Header preview"
                                    className="h-full w-full object-cover"
                                  />
                                ) : headerFormat === 'video' ? (
                                  <video
                                    src={previewMediaUrl}
                                    className="h-full w-full object-cover"
                                    muted
                                  />
                                ) : (
                                  <FileText className="w-8 h-8 text-swiss-accent" />
                                )}
                                {!uploadingMedia && (
                                  <span className="absolute inset-0 flex items-center justify-center bg-[#050505]/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                    <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-[#050505]">
                                      <Pencil className="w-3 h-3" aria-hidden />
                                      Edit
                                    </span>
                                  </span>
                                )}
                              </button>
                              <div className="min-w-0 flex-1 pt-0.5">
                                <p className="truncate text-sm font-medium text-[#050505]">
                                  {headerMediaFileName || 'Sample uploaded'}
                                </p>
                                <p className="mt-0.5 text-meta text-[#65676b]">
                                  {HEADER_MEDIA_HINT[headerFormat]}
                                </p>
                                <button
                                  type="button"
                                  disabled={uploadingMedia}
                                  onClick={() => fileInputRef.current?.click()}
                                  className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-swiss-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-swiss-accent-hover disabled:opacity-60"
                                >
                                  {uploadingMedia ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                                  ) : (
                                    <Pencil className="w-3.5 h-3.5" aria-hidden />
                                  )}
                                  Edit {headerFormat}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={uploadingMedia}
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-black/10 rounded-lg px-4 py-8 flex flex-col items-center justify-center gap-2 text-[#65676b] hover:border-swiss-accent hover:bg-surface-muted transition-colors disabled:opacity-60 cursor-pointer"
                          >
                            {uploadingMedia ? (
                              <>
                                <Loader2 className="w-8 h-8 animate-spin text-swiss-accent" />
                                <span className="text-sm font-medium">Uploading to Meta…</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-8 h-8 text-swiss-accent" />
                                <span className="text-sm font-semibold text-[#050505]">
                                  Upload sample {headerFormat}
                                </span>
                                <span className="text-meta">{HEADER_MEDIA_HINT[headerFormat]}</span>
                              </>
                            )}
                          </button>
                        )}
                        {mediaError && (
                          <p className="text-sm text-red-600 font-medium">{mediaError}</p>
                        )}
                        <p className="text-meta text-[#65676b]">
                          Meta requires a sample file when creating media headers. This is only used
                          for review. Category, body, footer, and buttons stay editable below.
                        </p>
                      </div>
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
                    <Textarea
                      ref={bodyRef}
                      value={bodyPattern}
                      onChange={(e) => setBodyPattern(e.target.value.slice(0, BODY_MAX))}
                      rows={8}
                      placeholder="Write your message. Use {{1}}, {{2}} for variables."
                      className="min-h-0 w-full border border-swiss-line bg-white rounded-lg px-3 py-2 text-sm leading-relaxed outline-none focus:border-swiss-accent focus:ring-2 focus:ring-swiss-accent/15 resize-none min-h-[160px]"
                    />
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={insertVariable}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-meta font-semibold text-swiss-accent border border-swiss-accent rounded-md hover:bg-swiss-accent/10"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add variable
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-meta font-semibold text-[#050505] mb-1">
                      Footer <span className="font-normal text-[#65676b]">· Optional</span>
                    </label>
                    <Input
                      value={footer}
                      onChange={(e) => setFooter(e.target.value.slice(0, FOOTER_MAX))}
                      maxLength={FOOTER_MAX}
                      placeholder="Reply STOP to unsubscribe"
                      className="h-auto w-full border border-swiss-line bg-white rounded-lg px-3 py-2 text-sm outline-none focus:border-swiss-accent focus:ring-2 focus:ring-swiss-accent/15"
                    />
                  </div>

                  <div ref={buttonsSectionRef} className="scroll-mt-6">
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-semibold text-[#050505]">
                        Buttons <span className="font-normal text-[#65676b]">· Optional</span>
                      </label>
                    </div>

                    {buttonKind === 'none' ? (
                      <div className="relative pb-2">
                        <button
                          type="button"
                          onClick={() => setShowButtonMenu((v) => !v)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-swiss-accent px-3 py-2 text-sm font-semibold text-swiss-accent hover:bg-swiss-accent/10"
                        >
                          <Plus className="w-4 h-4" />
                          Add button
                        </button>
                        {showButtonMenu && (
                          <div className="relative z-20 mt-1 w-full max-w-sm overflow-hidden rounded-lg bg-white ring-1 ring-swiss-line shadow-lg">
                            {BUTTON_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => addButton(opt.value)}
                                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-surface-muted border-b border-swiss-line last:border-0"
                              >
                                <span className="mt-0.5 text-swiss-accent">{opt.icon}</span>
                                <span>
                                  <span className="block text-sm font-semibold text-[#050505]">
                                    {opt.label}
                                  </span>
                                  <span className="block text-meta text-[#65676b]">{opt.desc}</span>
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="border border-swiss-line rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-swiss-line">
                          <span className="text-sm font-semibold text-[#050505] flex items-center gap-2">
                            {BUTTON_OPTIONS.find((b) => b.value === buttonKind)?.icon}
                            {BUTTON_OPTIONS.find((b) => b.value === buttonKind)?.label}
                          </span>
                          <button
                            type="button"
                            onClick={removeButton}
                            className="p-1.5 rounded-md text-[#65676b] hover:bg-surface-muted hover:text-red-600"
                            aria-label="Remove button"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="p-3 space-y-3">
                          <div>
                            <label className="block text-meta font-semibold text-[#65676b] mb-1">
                              Button text
                            </label>
                            <Input
                              value={buttonText}
                              onChange={(e) =>
                                setButtonText(e.target.value.slice(0, BUTTON_LABEL_MAX))
                              }
                              maxLength={BUTTON_LABEL_MAX}
                              placeholder={
                                buttonKind === 'URL'
                                  ? 'Visit website'
                                  : buttonKind === 'PHONE_NUMBER'
                                    ? 'Call us'
                                    : buttonKind === 'FLOW'
                                      ? 'Open'
                                      : 'Quick reply'
                              }
                              className="h-auto w-full border border-swiss-line bg-white rounded-lg px-3 py-2 text-sm outline-none focus:border-swiss-accent focus:ring-2 focus:ring-swiss-accent/15"
                            />
                          </div>
                          {buttonKind === 'URL' && (
                            <div className="sm:col-span-2 space-y-3">
                              <div>
                                <label className="block text-meta font-semibold text-[#65676b] mb-1">
                                  Website URL
                                </label>
                                <Input
                                  value={buttonUrl}
                                  onChange={(e) => setButtonUrl(e.target.value)}
                                  placeholder="https://www.example.com or https://example.com/{{1}}"
                                  className="h-auto w-full border border-swiss-line bg-white rounded-lg px-3 py-2 text-sm outline-none focus:border-swiss-accent focus:ring-2 focus:ring-swiss-accent/15"
                                />
                              </div>
                              {/\{\{\d+\}\}/.test(buttonUrl) && (
                                <div>
                                  <label className="block text-meta font-semibold text-[#65676b] mb-1">
                                    URL sample for Meta review
                                  </label>
                                  <Input
                                    value={buttonUrlSample}
                                    onChange={(e) => setButtonUrlSample(e.target.value)}
                                    placeholder="sample_payment_id"
                                    className="h-auto w-full border border-swiss-line bg-white rounded-lg px-3 py-2 text-sm outline-none focus:border-swiss-accent focus:ring-2 focus:ring-swiss-accent/15"
                                  />
                                  <p className="text-meta text-[#65676b] mt-1">
                                    Meta needs a sample value for {'{{1}}'} in the button URL (not the
                                    full link).
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          {buttonKind === 'PHONE_NUMBER' && (
                            <div>
                              <label className="block text-meta font-semibold text-[#65676b] mb-1">
                                Phone number
                              </label>
                              <Input
                                value={buttonPhone}
                                onChange={(e) => setButtonPhone(e.target.value)}
                                placeholder="+91 98765 43210"
                                className="h-auto w-full border border-swiss-line bg-white rounded-lg px-3 py-2 text-sm outline-none focus:border-swiss-accent focus:ring-2 focus:ring-swiss-accent/15"
                              />
                              <p className="text-meta text-[#65676b] mt-1">
                                Include country code, e.g. +91 for India
                              </p>
                            </div>
                          )}
                          {buttonKind === 'FLOW' && (
                            <div>
                              <label className="block text-meta font-semibold text-[#65676b] mb-1">
                                Flow
                              </label>
                              <select
                                value={buttonFlowId}
                                onChange={(e) => setButtonFlowId(e.target.value)}
                                className="w-full border border-swiss-line bg-white rounded-lg px-3 py-2 text-sm outline-none focus:border-swiss-accent focus:ring-2 focus:ring-swiss-accent/15"
                              >
                                <option value="">Select a published flow</option>
                                {publishedFlows.map((f) => (
                                  <option key={f.id} value={f.id}>
                                    {f.name}
                                  </option>
                                ))}
                              </select>
                              <p className="text-meta text-[#65676b] mt-1">
                                Only published flows can be attached — this opens outside the 24h
                                chat window.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {varCount > 0 && (
                    <div className="p-3 bg-white rounded-lg border border-swiss-line space-y-2 h-fit">
                      <p className="text-meta font-semibold text-[#050505]">Variable samples</p>
                      <p className="text-meta text-[#65676b]">
                        Shown in preview and sent to Meta for review.
                      </p>
                      {variableSamples.map((sample, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-12 text-meta font-mono font-semibold text-swiss-accent">
                            {`{{${i + 1}}}`}
                          </span>
                          <Input
                            value={sample}
                            onChange={(e) => {
                              const next = [...variableSamples];
                              next[i] = e.target.value;
                              setVariableSamples(next);
                            }}
                            className="h-auto flex-1 bg-white ring-1 ring-swiss-line rounded-lg px-3 py-1.5 text-sm outline-none focus:border-swiss-accent focus:ring-2 focus:ring-swiss-accent/15"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {!contentLocked && (
                    <label className="flex items-start gap-3 p-3 bg-white rounded-lg border border-swiss-line cursor-pointer h-fit">
                      <input
                        type="checkbox"
                        checked={submitToMeta}
                        onChange={(e) => setSubmitToMeta(e.target.checked)}
                        className="mt-0.5 accent-swiss-accent"
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
              </fieldset>
            </Section>
          </div>
        </div>

        <aside className="flex h-full min-h-0 w-[min(42vw,520px)] shrink-0 flex-col overflow-y-auto border-l border-[#c5b9a8] bg-[#e5ddd5] px-6 py-5">
          <WhatsAppTemplatePreview
            headerFormat={headerFormat}
            header={header}
            headerMediaPreviewUrl={previewMediaUrl}
            headerMediaFileName={headerMediaFileName}
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
