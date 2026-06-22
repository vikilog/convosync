import React from 'react';
import { X } from 'lucide-react';
import { PROMPT_TEMPLATES } from './constants';

type Props = {
  onClose: () => void;
  onSelect: (content: string) => void;
};

export const PromptTemplatesModal: React.FC<Props> = ({ onClose, onSelect }) => (
  <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl w-full max-w-lg border border-[#E5E7EB] shadow-2xl max-h-[80vh] flex flex-col">
      <div className="flex justify-between items-center px-6 py-4 border-b border-[#E5E7EB]">
        <h3 className="text-base font-bold text-[#111827]">Prompt templates</h3>
        <button type="button" onClick={onClose} className="text-[#6B7280] hover:text-[#111827]">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4 space-y-2 overflow-y-auto">
        {PROMPT_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              onSelect(t.content);
              onClose();
            }}
            className="w-full text-left p-4 border border-[#E5E7EB] rounded-xl hover:border-[#0284c7] hover:bg-[#F3F0FF]/40 transition-colors"
          >
            <p className="text-sm font-bold text-[#111827]">{t.title}</p>
            <p className="text-xs text-[#6B7280] mt-1 line-clamp-2 whitespace-pre-line">
              {t.content}
            </p>
          </button>
        ))}
      </div>
    </div>
  </div>
);
