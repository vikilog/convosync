import React, { useMemo } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { useEmailBuilderStore } from './store';
import { renderDesignToFullHtml } from './renderHtml';
import { Input } from '../../ui/input';
import {
  buildSampleVariables,
  extractEmailTemplateVariables,
} from '../emailTemplateUtils';

const inputCls =
  'w-full rounded-lg border border-swiss-line bg-white px-3 py-2 text-sm text-swiss-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary';

type Props = {
  showCopyTokens?: boolean;
  compact?: boolean;
};

export function VariablePreviewForm({ showCopyTokens = true, compact = false }: Props) {
  const blocks = useEmailBuilderStore((s) => s.blocks);
  const brand = useEmailBuilderStore((s) => s.brand);
  const subject = useEmailBuilderStore((s) => s.subject);
  const previewVariables = useEmailBuilderStore((s) => s.previewVariables);
  const setPreviewVariable = useEmailBuilderStore((s) => s.setPreviewVariable);
  const resetPreviewVariables = useEmailBuilderStore((s) => s.resetPreviewVariables);

  const [copiedVar, setCopiedVar] = React.useState('');

  const variableKeys = useMemo(() => {
    const html = renderDesignToFullHtml({ version: 1, blocks, brand });
    return extractEmailTemplateVariables(subject, html);
  }, [subject, blocks, brand]);

  const defaults = useMemo(() => buildSampleVariables(variableKeys), [variableKeys]);

  const copyVar = (key: string) => {
    void navigator.clipboard.writeText(`{{${key}}}`);
    setCopiedVar(key);
    setTimeout(() => setCopiedVar(''), 1500);
  };

  if (variableKeys.length === 0) {
    return (
      <p className="text-xs text-swiss-muted">
        No {'{{variables}}'} in this template yet. Add them in the subject or block content.
      </p>
    );
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-swiss-ink">Preview values</p>
          <p className="text-meta text-swiss-muted mt-0.5">
            Fill values to see the real email in Preview
          </p>
        </div>
        <button
          type="button"
          onClick={resetPreviewVariables}
          className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-meta font-semibold text-swiss-muted border border-swiss-line hover:bg-[#f4f5f7]"
          title="Reset to sample defaults"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      <div className="space-y-3">
        {variableKeys.map((key) => {
          const placeholder = defaults[key] ?? '';
          const value = previewVariables[key] ?? '';
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor={`pv-${key}`} className="text-xs font-mono text-primary font-semibold">
                  {`{{${key}}}`}
                </label>
                {showCopyTokens ? (
                  <button
                    type="button"
                    onClick={() => copyVar(key)}
                    className="text-xs text-swiss-faint hover:text-primary inline-flex items-center gap-0.5"
                  >
                    {copiedVar === key ? (
                      'Copied'
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy
                      </>
                    )}
                  </button>
                ) : null}
              </div>
              <Input
                id={`pv-${key}`}
                className={inputCls}
                value={value}
                placeholder={placeholder}
                onChange={(e) => setPreviewVariable(key, e.target.value)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
