import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { KnowledgeItem } from '../types';
import type { QnAPair } from './QnAForm';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';

export type KnowledgeEditPayload = {
  title: string;
  content?: string | null;
  url?: string | null;
  metadata?: Record<string, unknown>;
};

type Props = {
  item: KnowledgeItem;
  onClose: () => void;
  onSave: (data: KnowledgeEditPayload) => void;
  submitting?: boolean;
};

function parseQnAPairs(item: KnowledgeItem): QnAPair[] {
  if (item.content) {
    try {
      const parsed = JSON.parse(item.content) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p) => ({
          question: String((p as QnAPair).question ?? ''),
          answer: String((p as QnAPair).answer ?? ''),
        }));
      }
    } catch {
      /* plain text fallback */
    }
  }
  return [{ question: item.title, answer: item.content ?? '' }];
}

export const EditKnowledgeModal: React.FC<Props> = ({
  item,
  onClose,
  onSave,
  submitting,
}) => {
  const initialPairs = useMemo(() => parseQnAPairs(item), [item]);
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content ?? '');
  const [url, setUrl] = useState(item.url ?? '');
  const [pairs, setPairs] = useState<QnAPair[]>(initialPairs);
  const [error, setError] = useState<string | null>(null);

  const canSave = title.trim().length > 0;

  const handleSave = () => {
    if (!canSave) {
      setError('Title is required');
      return;
    }
    setError(null);

    if (item.type === 'qna') {
      const valid = pairs.filter((p) => p.question.trim() && p.answer.trim());
      if (valid.length === 0) {
        setError('Add at least one question and answer');
        return;
      }
      onSave({
        title: title.trim() || valid[0].question.trim(),
        content: JSON.stringify(valid),
        metadata: { pairs: valid },
      });
      return;
    }

    if (item.type === 'online_data') {
      onSave({
        title: title.trim(),
        url: url.trim() || null,
        content: content.trim() || null,
      });
      return;
    }

    onSave({
      title: title.trim(),
      content: content.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl border border-swiss-line shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-swiss-line shrink-0">
          <h3 className="text-base font-bold text-[#111827]">Edit knowledge</h3>
          <button type="button" onClick={onClose} className="text-[#6B7280] hover:text-[#111827]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <p className="text-xs text-[#6B7280] capitalize">Type: {item.type.replace('_', ' ')}</p>

          <label className="block">
            <span className="text-sm font-bold text-[#111827]">Title</span>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-auto mt-1.5 w-full px-3 py-2 border border-swiss-line rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </label>

          {item.type === 'online_data' && (
            <label className="block">
              <span className="text-sm font-bold text-[#111827]">URL</span>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-auto mt-1.5 w-full px-3 py-2 border border-swiss-line rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </label>
          )}

          {item.type === 'qna' ? (
            <div className="space-y-3">
              {pairs.map((pair, index) => (
                <div key={index} className="space-y-2 p-3 rounded-xl border border-swiss-line">
                  <Input
                    type="text"
                    value={pair.question}
                    onChange={(e) => {
                      const next = [...pairs];
                      next[index] = { ...pair, question: e.target.value };
                      setPairs(next);
                    }}
                    placeholder="Question"
                    className="h-auto w-full px-3 py-2 border border-swiss-line rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <Textarea
                    value={pair.answer}
                    onChange={(e) => {
                      const next = [...pairs];
                      next[index] = { ...pair, answer: e.target.value };
                      setPairs(next);
                    }}
                    placeholder="Answer"
                    rows={3}
                    className="min-h-0 w-full px-3 py-2 border border-swiss-line rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => setPairs([...pairs, { question: '', answer: '' }])}
                className="text-sm font-bold text-primary hover:underline"
              >
                + Add Q&A pair
              </button>
            </div>
          ) : (
            <label className="block">
              <span className="text-sm font-bold text-[#111827]">
                {item.type === 'attachment' ? 'Description' : 'Content'}
              </span>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                placeholder={
                  item.type === 'online_data'
                    ? 'Cached page text (optional — re-add URL to refresh from web)'
                    : 'Knowledge content the agent can use…'
                }
                className="min-h-0 mt-1.5 w-full px-3 py-2 border border-swiss-line rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-y min-h-[140px]"
              />
            </label>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-swiss-line shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-[#6B7280] hover:text-[#111827]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting || !canSave}
            onClick={handleSave}
            className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-xl text-sm font-bold"
          >
            {submitting ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
