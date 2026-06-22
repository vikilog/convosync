import React, { useMemo } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { useEmailBuilderStore } from './store';
import { renderDesignToFullHtml } from './renderHtml';
import {
  applyEmailTemplateVariables,
  extractEmailTemplateVariables,
  mergePreviewVariables,
} from '../emailTemplateUtils';

export function PreviewPane() {
  const blocks = useEmailBuilderStore((s) => s.blocks);
  const brand = useEmailBuilderStore((s) => s.brand);
  const subject = useEmailBuilderStore((s) => s.subject);
  const previewMode = useEmailBuilderStore((s) => s.previewMode);
  const setPreviewMode = useEmailBuilderStore((s) => s.setPreviewMode);
  const previewVariables = useEmailBuilderStore((s) => s.previewVariables);

  const { previewSubject, previewHtml } = useMemo(() => {
    const design = { version: 1 as const, blocks, brand };
    const html = renderDesignToFullHtml(design);
    const vars = extractEmailTemplateVariables(subject, html);
    const merged = mergePreviewVariables(vars, previewVariables);
    return {
      previewSubject: applyEmailTemplateVariables(subject, merged),
      previewHtml: applyEmailTemplateVariables(html, merged),
    };
  }, [blocks, brand, subject, previewVariables]);

  const isMobile = previewMode === 'mobile';

  return (
    <div className="flex-1 min-h-0 min-w-0 flex flex-col bg-[#eceff4]">
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-white">
        <div className="min-w-0 flex-1 pr-4">
          <p className="text-sm font-bold uppercase text-gray-400">Subject preview</p>
          <p className="text-sm font-semibold text-gray-900 truncate">{previewSubject}</p>
        </div>
        <div className="flex rounded-lg border border-slate-200 p-0.5 bg-[#f4f5f7]">
          <button
            type="button"
            onClick={() => setPreviewMode('desktop')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm font-semibold ${
              previewMode === 'desktop' ? 'bg-white shadow text-primary' : 'text-gray-500'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" /> Desktop
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('mobile')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm font-semibold ${
              previewMode === 'mobile' ? 'bg-white shadow text-primary' : 'text-gray-500'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> Mobile
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 md:p-4 flex">
        <div
          className={`transition-all duration-300 shadow-lg rounded-xl overflow-hidden border border-slate-200 bg-white flex-1 min-h-0 flex flex-col ${
            isMobile ? 'max-w-[375px] mx-auto w-full' : 'w-full'
          }`}
        >
          <iframe
            title="Email preview"
            srcDoc={previewHtml}
            className="w-full flex-1 border-0 bg-white min-h-[calc(100vh-12rem)]"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
