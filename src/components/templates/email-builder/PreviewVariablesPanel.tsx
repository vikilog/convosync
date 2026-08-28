import React from 'react';
import { Braces } from 'lucide-react';
import { VariablePreviewForm } from './VariablePreviewForm';

export function PreviewVariablesPanel() {
  return (
    <aside className="w-[300px] shrink-0 border-l border-swiss-line bg-white flex flex-col min-h-0">
      <div className="px-4 py-3 border-b border-swiss-line">
        <div className="flex items-center gap-2">
          <Braces className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-swiss-ink">Test data</h3>
        </div>
        <p className="text-meta text-swiss-muted mt-1">
          Values apply instantly to the preview on the left
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 bg-surface-muted/30">
        <VariablePreviewForm showCopyTokens={false} />
      </div>
    </aside>
  );
}
