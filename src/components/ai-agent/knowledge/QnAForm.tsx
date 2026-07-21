import React, { useRef, useState } from 'react';
import { ClipboardPaste, FileUp, Plus, X } from 'lucide-react';
import { parseFaqBulk } from './parseFaqBulk';

export type QnAPair = { question: string; answer: string };

type Props = {
  onChange: (pairs: QnAPair[]) => void;
};

type BulkMode = 'manual' | 'paste' | 'file';

export const QnAForm: React.FC<Props> = ({ onChange }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pairs, setPairs] = useState<QnAPair[]>([{ question: '', answer: '' }]);
  const [bulkMode, setBulkMode] = useState<BulkMode>('manual');
  const [pasteText, setPasteText] = useState('');
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [loadedInfo, setLoadedInfo] = useState<string | null>(null);

  const updatePairs = (next: QnAPair[]) => {
    setPairs(next);
    onChange(next);
  };

  const applyParsed = (text: string, sourceLabel?: string) => {
    const parsed = parseFaqBulk(text);
    if (!parsed.length) {
      setBulkError('No Q&A pairs found. Use Q:/A: labels, blank-line pairs, CSV, or JSON.');
      setLoadedInfo(null);
      return;
    }
    setBulkError(null);
    setLoadedInfo(
      sourceLabel
        ? `Loaded ${parsed.length} FAQ${parsed.length === 1 ? '' : 's'} from ${sourceLabel}. Edit below if needed.`
        : `Loaded ${parsed.length} FAQ${parsed.length === 1 ? '' : 's'}. Edit below if needed.`
    );
    updatePairs(parsed);
    setBulkMode('manual');
    setPasteText('');
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

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const ok = /\.(txt|md|csv|json)$/i.test(file.name);
    if (!ok) {
      setBulkError('Use a .txt, .md, .csv, or .json file.');
      return;
    }
    try {
      applyParsed(await file.text(), file.name);
    } catch {
      setBulkError('Could not read that file.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setBulkMode((m) => (m === 'paste' ? 'manual' : 'paste'));
            setBulkError(null);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border transition-colors ${
            bulkMode === 'paste'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-black/5 text-[#111827] hover:border-primary'
          }`}
        >
          <ClipboardPaste className="w-4 h-4" />
          Paste FAQs
        </button>
        <button
          type="button"
          onClick={() => {
            setBulkMode('file');
            setBulkError(null);
            fileRef.current?.click();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border border-black/5 text-[#111827] hover:border-primary"
        >
          <FileUp className="w-4 h-4" />
          Import file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.md,.csv,.json,text/plain,text/markdown,text/csv,application/json"
          className="hidden"
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>

      {bulkMode === 'paste' && (
        <div className="space-y-2">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={8}
            placeholder={`Paste FAQs here, e.g.\n\nQ: What are your hours?\nA: Mon–Fri 9 AM–6 PM.\n\nQ: Do you ship internationally?\nA: Yes, to most countries.`}
            className="w-full border border-black/5 rounded-xl py-2.5 px-3 text-sm font-mono resize-y focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-[#6B7280]">
              Supports Q:/A:, blank-line pairs, CSV (question,answer), or JSON.
            </p>
            <button
              type="button"
              disabled={!pasteText.trim()}
              onClick={() => applyParsed(pasteText)}
              className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl text-sm font-bold"
            >
              Load FAQs
            </button>
          </div>
        </div>
      )}

      {bulkError && <p className="text-sm text-red-600">{bulkError}</p>}
      {loadedInfo && !bulkError && (
        <p className="text-xs text-emerald-700 font-medium">{loadedInfo}</p>
      )}

      {pairs.map((pair, index) => (
        <div key={index} className="p-4 border border-black/5 rounded-xl space-y-3 relative">
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
            <label className="block text-sm font-medium text-[#111827] mb-1.5">
              Question {pairs.length > 1 ? `${index + 1}` : ''}
            </label>
            <input
              type="text"
              value={pair.question}
              onChange={(e) => updatePair(index, { question: e.target.value })}
              placeholder="What are your business hours?"
              className="w-full border border-black/5 rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1.5">Answer</label>
            <textarea
              value={pair.answer}
              onChange={(e) => updatePair(index, { answer: e.target.value })}
              placeholder="We are open Monday to Friday, 9 AM to 6 PM."
              rows={3}
              className="w-full border border-black/5 rounded-xl py-2.5 px-3 text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addPair}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary-hover"
      >
        <Plus className="w-4 h-4" />
        Add another Q&A
      </button>
    </div>
  );
};
