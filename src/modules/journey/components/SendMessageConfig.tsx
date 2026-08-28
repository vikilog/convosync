import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { CampaignTemplate } from '../../../types';
import { api } from '../../../lib/api';
import { mapTemplateFromApi } from '../../../lib/mappers';
import { statusUiToSlug } from '../../../lib/templateLabels';
import { TemplateStatusBadge } from '../../../components/templates/TemplateStatusBadge';
import { countBodyVariables, renderBodyWithSamples } from '../../../components/templates/templateBuilderUtils';
import { ChannelMessagePreviews } from './ChannelMessagePreviews';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';

export type MessageMode = 'text' | 'template' | 'cta_url';

const CTA_URL_LABEL_MAX = 20;

type Props = {
  local: Record<string, unknown>;
  patch: (key: string, value: unknown) => void;
  patchMany: (updates: Record<string, unknown>) => void;
};

function resolveMode(local: Record<string, unknown>): MessageMode {
  if (local.messageMode === 'text' || local.messageMode === 'template' || local.messageMode === 'cta_url') {
    return local.messageMode;
  }
  if (local.templateName || local.templateId) return 'template';
  return 'text';
}

function variableArray(local: Record<string, unknown>): string[] {
  const v = local.variables;
  if (Array.isArray(v)) return v.map(String);
  if (v && typeof v === 'object') return Object.values(v as Record<string, string>).map(String);
  return [];
}

function CompactTemplatePreview({
  template,
  samples,
}: {
  template: CampaignTemplate;
  samples: string[];
}) {
  const body = renderBodyWithSamples(template.bodyPattern, samples);
  const showHeader = template.header?.trim();

  return (
    <div className="rounded-lg border border-swiss-line bg-white p-2.5">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Template content
      </p>
      <div className="overflow-hidden rounded-lg border border-border-subtle text-[11px] text-[#111b21]">
        {showHeader && (
          <p className="px-2.5 pt-2 font-semibold leading-snug">{template.header}</p>
        )}
        <p className="whitespace-pre-wrap break-words px-2.5 py-2 leading-relaxed">{body}</p>
        {template.footer?.trim() && (
          <p className="px-2.5 pb-2 text-xs text-[#667781]">{template.footer}</p>
        )}
        {template.buttonText?.trim() && template.buttonType && (
          <div className="border-t border-[#e9edef] px-2.5 py-2 text-center text-meta font-medium text-[#008069]">
            {template.buttonText}
          </div>
        )}
      </div>
    </div>
  );
}

export function SendMessageConfig({ local, patch, patchMany }: Props) {
  const mode = resolveMode(local);
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'template') return;
    setLoading(true);
    setLoadError(null);
    api
      .getTemplates()
      .then((rows: Record<string, unknown>[]) => {
        setTemplates(rows.map((r) => mapTemplateFromApi(r)));
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : 'Failed to load templates');
      })
      .finally(() => setLoading(false));
  }, [mode]);

  const selectedTemplate = useMemo(() => {
    const id = local.templateId ? String(local.templateId) : '';
    const name = local.templateName ? String(local.templateName) : '';
    if (id) return templates.find((t) => t.id === id) ?? null;
    if (name) return templates.find((t) => t.name === name) ?? null;
    return null;
  }, [templates, local.templateId, local.templateName]);

  const varCount = selectedTemplate ? countBodyVariables(selectedTemplate.bodyPattern) : 0;
  const variableValues = variableArray(local);

  const setMode = (next: MessageMode) => {
    if (next === mode) return;
    if (next === 'text') {
      patchMany({
        messageMode: 'text',
        templateId: '',
        templateName: '',
        variables: [],
      });
    } else if (next === 'template') {
      patchMany({
        messageMode: 'template',
        text: '',
      });
    } else {
      patchMany({
        messageMode: 'cta_url',
        templateId: '',
        templateName: '',
        variables: [],
      });
    }
  };

  const selectTemplate = (template: CampaignTemplate) => {
    const count = countBodyVariables(template.bodyPattern);
    const prev = variableArray(local);
    const nextVars = Array.from({ length: count }, (_, i) => {
      if (prev[i]?.trim()) return prev[i];
      const label = (template.variables[i] || '').toLowerCase();
      if (label.includes('name') || label.includes('first')) return '{{contact.name}}';
      if (label.includes('phone')) return '{{contact.phone}}';
      if (label.includes('email')) return '{{contact.email}}';
      return '';
    });

    patchMany({
      messageMode: 'template',
      templateId: template.id ?? '',
      templateName: template.name,
      language: template.language ?? 'en',
      variables: nextVars,
      text: '',
    });
  };

  const setVariable = (index: number, value: string) => {
    const next = [...variableValues];
    while (next.length <= index) next.push('');
    next[index] = value;
    patch('variables', next);
  };

  const previewBody =
    mode === 'template'
      ? selectedTemplate
        ? [
            selectedTemplate.header?.trim(),
            renderBodyWithSamples(selectedTemplate.bodyPattern, variableValues),
            selectedTemplate.footer?.trim(),
          ]
            .filter(Boolean)
            .join('\n\n')
        : ''
      : String(local.text ?? '');

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-sm font-semibold text-swiss-ink">Message type</p>
        <div className="grid grid-cols-3 gap-1 rounded-lg border border-swiss-line bg-slate-50 p-1">
          {(['text', 'template', 'cta_url'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setMode(opt)}
              className={`rounded-md py-1.5 text-xs font-bold transition-colors ${
                mode === opt
                  ? 'border border-primary/20 bg-white text-primary '
                  : 'text-swiss-muted hover:text-swiss-ink'
              }`}
            >
              {opt === 'text' ? 'Text' : opt === 'template' ? 'Template' : 'Link button'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'text' && (
        <>
          <label className="block text-sm font-semibold text-swiss-ink">
            Message text
            <Textarea
              className="min-h-0 mt-1 min-h-[96px] w-full rounded-lg border border-swiss-line px-2 py-1.5 text-sm"
              value={String(local.text ?? '')}
              onChange={(e) => patch('text', e.target.value)}
              placeholder="Hi {{contact.name}}, thanks for reaching out!"
            />
          </label>
          <p className="text-xs text-swiss-faint">
            Variables: {'{{contact.name}}'}, {'{{contact.phone}}'}, {'{{contact.email}}'}
          </p>
          <ChannelMessagePreviews body={previewBody} />
        </>
      )}

      {mode === 'cta_url' && (
        <>
          <p className="rounded-lg bg-primary/5 px-2.5 py-2 text-xs leading-relaxed text-primary">
            WhatsApp&apos;s CTA URL message — the only Meta-accepted way to attach a link button.
            Reply buttons can&apos;t open a URL, so this sends as its own message type.
          </p>
          <label className="block text-sm font-semibold text-swiss-ink">
            Message text
            <Textarea
              className="min-h-0 mt-1 min-h-[80px] w-full rounded-lg border border-swiss-line px-2 py-1.5 text-sm"
              value={String(local.text ?? '')}
              onChange={(e) => patch('text', e.target.value)}
              placeholder="Hi {{contact.name}}, here's your link:"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm font-semibold text-swiss-ink">
              Button label
              <Input
                className="h-auto mt-1 w-full rounded-lg border border-swiss-line px-2 py-1.5 text-sm"
                value={String(local.ctaLabel ?? '')}
                maxLength={CTA_URL_LABEL_MAX}
                onChange={(e) => patch('ctaLabel', e.target.value)}
                placeholder="Open link"
              />
              <span className="mt-1 block text-right text-xs text-slate-400">
                {String(local.ctaLabel ?? '').length}/{CTA_URL_LABEL_MAX}
              </span>
            </label>
            <label className="block text-sm font-semibold text-swiss-ink">
              URL
              <Input
                className="h-auto mt-1 w-full rounded-lg border border-swiss-line px-2 py-1.5 text-sm font-mono text-xs"
                value={String(local.ctaUrl ?? '')}
                onChange={(e) => patch('ctaUrl', e.target.value)}
                placeholder="https://…"
              />
            </label>
          </div>
          <ChannelMessagePreviews body={previewBody} />
        </>
      )}

      {mode === 'template' && (
        <>
          {loadError && (
            <p className="rounded-lg border border-rose-100 bg-rose-50 px-2 py-1.5 text-meta font-semibold text-rose-600">
              {loadError}
            </p>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-swiss-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading templates…
            </div>
          ) : templates.length === 0 ? (
            <p className="rounded-lg border border-swiss-line bg-gray-50 px-3 py-3 text-center text-xs text-swiss-muted">
              No templates found. Create or sync templates from the Templates page.
            </p>
          ) : (
            <>
              <div>
                <p className="mb-1.5 text-sm font-semibold text-swiss-ink">Choose template</p>
                <ul className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-swiss-line bg-slate-50 p-1.5">
                  {templates.map((t) => {
                    const active =
                      (local.templateId && t.id === String(local.templateId)) ||
                      (!local.templateId && t.name === String(local.templateName ?? ''));
                    return (
                      <li key={t.id ?? t.name}>
                        <button
                          type="button"
                          onClick={() => selectTemplate(t)}
                          className={`w-full rounded-lg px-2.5 py-2 text-left transition-colors ${
                            active
                              ? 'border border-primary/25 bg-primary/10'
                              : 'border border-transparent hover:bg-white'
                          }`}
                        >
                          <p className="truncate font-mono text-sm font-bold text-swiss-ink">
                            {t.name}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            <TemplateStatusBadge status={statusUiToSlug(t.status)} />
                            <span className="text-xs text-swiss-faint">{t.category}</span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {selectedTemplate && (
                <>
                  {selectedTemplate.status !== 'Approved' && (
                    <p className="rounded-lg border border-amber-100 bg-amber-50 px-2 py-1.5 text-meta text-amber-800">
                      This template is {selectedTemplate.status}. Only Approved templates can be
                      sent.
                    </p>
                  )}

                  <CompactTemplatePreview
                    template={selectedTemplate}
                    samples={variableValues}
                  />

                  {varCount > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold uppercase tracking-wide text-swiss-faint">
                        Variable mapping
                      </p>
                      {Array.from({ length: varCount }, (_, i) => {
                        const label = selectedTemplate.variables[i] || `Variable {{${i + 1}}}`;
                        return (
                          <label key={i} className="block">
                            <span className="text-sm font-bold text-swiss-muted">{label}</span>
                            <Input
                              type="text"
                              value={variableValues[i] ?? ''}
                              onChange={(e) => setVariable(i, e.target.value)}
                              className="h-auto mt-1 w-full rounded-lg border border-swiss-line px-2 py-1.5 text-xs"
                              placeholder={`{{contact.name}} or static value`}
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}

                  <ChannelMessagePreviews
                    body={previewBody}
                    emptyHint="Select a template to preview on WhatsApp."
                  />
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
