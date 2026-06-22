import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { CampaignTemplate } from '../../../types';
import { api } from '../../../lib/api';
import { mapTemplateFromApi } from '../../../lib/mappers';
import { statusUiToSlug } from '../../../lib/templateLabels';
import { TemplateStatusBadge } from '../../../components/templates/TemplateStatusBadge';
import { countBodyVariables, renderBodyWithSamples } from '../../../components/templates/templateBuilderUtils';

export type MessageMode = 'text' | 'template';

type Props = {
  local: Record<string, unknown>;
  patch: (key: string, value: unknown) => void;
  patchMany: (updates: Record<string, unknown>) => void;
};

function resolveMode(local: Record<string, unknown>): MessageMode {
  if (local.messageMode === 'text' || local.messageMode === 'template') {
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
    <div className="rounded-lg border border-slate-200 bg-[#efeae2] p-2.5">
      <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">Preview</p>
      <div className="bg-white rounded-lg rounded-tl-sm shadow-sm overflow-hidden text-[#111b21] text-xs">
        {showHeader && (
          <p className="px-2.5 pt-2 font-semibold leading-snug">{template.header}</p>
        )}
        <p className="px-2.5 py-2 leading-relaxed whitespace-pre-wrap break-words">{body}</p>
        {template.footer?.trim() && (
          <p className="px-2.5 pb-2 text-xs text-[#667781]">{template.footer}</p>
        )}
        {template.buttonText?.trim() && template.buttonType && (
          <div className="border-t border-[#e9edef] px-2.5 py-2 text-meta font-medium text-[#008069] text-center">
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
    } else {
      patchMany({
        messageMode: 'template',
        text: '',
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

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-1.5">Message type</p>
        <div className="grid grid-cols-2 gap-1 rounded-lg border border-slate-200 p-1 bg-slate-50">
          {(['text', 'template'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setMode(opt)}
              className={`rounded-md py-1.5 text-sm font-bold capitalize transition-colors ${
                mode === opt
                  ? 'bg-white text-primary shadow-sm border border-primary/20'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {opt === 'text' ? 'Text' : 'Template'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'text' && (
        <>
          <label className="block text-sm font-semibold text-gray-700">
            Message text
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm min-h-[96px]"
              value={String(local.text ?? '')}
              onChange={(e) => patch('text', e.target.value)}
              placeholder="Hi {{contact.name}}, thanks for reaching out!"
            />
          </label>
          <p className="text-xs text-gray-400">
            Variables: {'{{contact.name}}'}, {'{{contact.phone}}'}, {'{{contact.email}}'}
          </p>
        </>
      )}

      {mode === 'template' && (
        <>
          {loadError && (
            <p className="text-meta font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-2 py-1.5">
              {loadError}
            </p>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-xs text-gray-500 py-4 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading templates…
            </div>
          ) : templates.length === 0 ? (
            <p className="text-xs text-gray-500 bg-gray-50 border border-slate-200 rounded-lg px-3 py-3 text-center">
              No templates found. Create or sync templates from the Templates page.
            </p>
          ) : (
            <>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1.5">Choose template</p>
                <ul className="max-h-44 overflow-y-auto space-y-1 rounded-lg border border-slate-200 p-1.5 bg-slate-50">
                  {templates.map((t) => {
                    const active =
                      (local.templateId && t.id === String(local.templateId)) ||
                      (!local.templateId && t.name === String(local.templateName ?? ''));
                    return (
                      <li key={t.id ?? t.name}>
                        <button
                          type="button"
                          onClick={() => selectTemplate(t)}
                          className={`w-full text-left rounded-lg px-2.5 py-2 transition-colors ${
                            active
                              ? 'bg-sky-50 border border-primary/25'
                              : 'hover:bg-white border border-transparent'
                          }`}
                        >
                          <p className="text-sm font-bold text-gray-900 font-mono truncate">{t.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <TemplateStatusBadge status={statusUiToSlug(t.status)} />
                            <span className="text-xs text-gray-400">{t.category}</span>
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
                    <p className="text-meta text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
                      This template is {selectedTemplate.status}. Only Approved templates can be sent.
                    </p>
                  )}

                  <CompactTemplatePreview
                    template={selectedTemplate}
                    samples={variableValues}
                  />

                  {varCount > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">
                        Variable mapping
                      </p>
                      {Array.from({ length: varCount }, (_, i) => {
                        const label = selectedTemplate.variables[i] || `Variable {{${i + 1}}}`;
                        return (
                          <label key={i} className="block">
                            <span className="text-sm font-bold text-gray-500">{label}</span>
                            <input
                              type="text"
                              value={variableValues[i] ?? ''}
                              onChange={(e) => setVariable(i, e.target.value)}
                              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                              placeholder={`{{contact.name}} or static value`}
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
