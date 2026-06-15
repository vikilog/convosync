import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

export type QnAPair = { question: string; answer: string };

type Props = {
  onChange: (pairs: QnAPair[]) => void;
};

export const QnAForm: React.FC<Props> = ({ onChange }) => {
  const [pairs, setPairs] = useState<QnAPair[]>([{ question: '', answer: '' }]);

  const updatePairs = (next: QnAPair[]) => {
    setPairs(next);
    onChange(next);
  };

  const updatePair = (index: number, patch: Partial<QnAPair>) => {
    const next = pairs.map((p, i) => (i === index ? { ...p, ...patch } : p));
    updatePairs(next);
  };

  const addPair = () => updatePairs([...pairs, { question: '', answer: '' }]);

  const removePair = (index: number) => {
    if (pairs.length === 1) return;
    updatePairs(pairs.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {pairs.map((pair, index) => (
        <div key={index} className="p-4 border border-[#E5E7EB] rounded-xl space-y-3 relative">
          {pairs.length > 1 && (
            <button
              type="button"
              onClick={() => removePair(index)}
              className="absolute top-3 right-3 text-[#6B7280] hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1.5">Question</label>
            <input
              type="text"
              value={pair.question}
              onChange={(e) => updatePair(index, { question: e.target.value })}
              placeholder="What are your business hours?"
              className="w-full border border-[#E5E7EB] rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1.5">Answer</label>
            <textarea
              value={pair.answer}
              onChange={(e) => updatePair(index, { answer: e.target.value })}
              placeholder="We are open Monday to Friday, 9 AM to 6 PM."
              rows={3}
              className="w-full border border-[#E5E7EB] rounded-xl py-2.5 px-3 text-sm resize-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] outline-none"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addPair}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-600 hover:text-[#5a52e0]"
      >
        <Plus className="w-4 h-4" />
        Add another Q&A
      </button>
    </div>
  );
};
