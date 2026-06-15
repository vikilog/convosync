import React, { useState } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';

type Props = {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => void;
};

const SUGGESTIONS = [
  'Welcome email for new SaaS signups',
  'Order confirmation with tracking CTA',
  'Re-engagement email for inactive users',
  'Product launch announcement',
];

export function AiAssistModal({ open, loading, onClose, onGenerate }: Props) {
  const [prompt, setPrompt] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-gray-900">AI content assistant</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            Describe the email you want. AI will generate subject line and block layout with merge variables.
          </p>
          <textarea
            className="w-full min-h-[120px] rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="e.g. A friendly onboarding email for new customers with a CTA to complete their profile"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
          />
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                disabled={loading}
                onClick={() => setPrompt(s)}
                className="text-xs px-2.5 py-1 rounded-full bg-[#eef2ff] text-primary font-medium hover:bg-primary/10"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-200 bg-[#fafbfc]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || prompt.trim().length < 3}
            onClick={() => onGenerate(prompt.trim())}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate template
          </button>
        </div>
      </div>
    </div>
  );
}
