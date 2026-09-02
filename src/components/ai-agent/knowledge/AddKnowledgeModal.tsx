import React, { useState } from 'react';
import { X, FileText, Link2, HelpCircle, Paperclip } from 'lucide-react';
import type { KnowledgeItem, KnowledgeType } from '../types';
import { DocumentUpload } from './DocumentUpload';
import { OnlineDataForm } from './OnlineDataForm';
import { QnAForm, type QnAPair } from './QnAForm';
import { AttachmentUpload } from './AttachmentUpload';

type Props = {
  agentId: string;
  onClose: () => void;
  onSubmit: (data: {
    type: KnowledgeType;
    title: string;
    content?: string;
    url?: string;
    metadata?: Record<string, unknown>;
  }) => void;
  onItemAdded?: (item: KnowledgeItem, message?: string) => void;
  onAttachmentSaved?: () => void;
  submitting?: boolean;
};

const OPTIONS: {
  id: KnowledgeType;
  title: string;
  boldLabel: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}[] = [
  {
    id: 'document',
    title: 'Document',
    boldLabel: 'AI learns from it:',
    description: 'content is parsed, chunked, indexed, and used to answer questions.',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: 'online_data',
    title: 'Online data',
    boldLabel: 'AI reads the page:',
    description: 'web content is fetched and refreshed as a knowledge source.',
    icon: <Link2 className="w-5 h-5" />,
  },
  {
    id: 'qna',
    title: 'Q&A',
    boldLabel: 'AI follows fixed answers:',
    description: 'best for predictable questions with prepared responses.',
    icon: <HelpCircle className="w-5 h-5" />,
  },
  {
    id: 'attachment',
    title: 'Attachment',
    boldLabel: 'Upload a complete document, image, or video',
    description:
      'Saved to Media Gallery — the AI detects the right moment and sends the original file (shared across this workspace’s agents).',
    icon: <Paperclip className="w-5 h-5" />,
    badge: 'New',
  },
];

export const AddKnowledgeModal: React.FC<Props> = ({
  agentId,
  onClose,
  onSubmit,
  onItemAdded,
  onAttachmentSaved,
  submitting,
}) => {
  const [step, setStep] = useState<'select' | 'form'>('select');
  const [selected, setSelected] = useState<KnowledgeType | null>(null);
  const [qnaPairs, setQnaPairs] = useState<QnAPair[]>([{ question: '', answer: '' }]);

  const canProceed = selected === 'qna' ? qnaPairs.some((p) => p.question.trim() && p.answer.trim()) : true;

  const handleSubmit = () => {
    if (!selected || selected !== 'qna') return;
    const first = qnaPairs.find((p) => p.question.trim() && p.answer.trim());
    onSubmit({
      type: 'qna',
      title: first?.question ?? 'Q&A',
      content: JSON.stringify(qnaPairs.filter((p) => p.question.trim())),
      metadata: { pairs: qnaPairs },
    });
  };

  const handleOnlineSaved = (item: KnowledgeItem) => {
    onItemAdded?.(item, 'Online data added successfully');
    onClose();
  };

  const handleDocumentSaved = (item: KnowledgeItem) => {
    onItemAdded?.(item, 'Document added successfully');
  };

  const handleAttachmentSaved = () => {
    onAttachmentSaved?.();
    onClose();
  };

  // Document/Attachment/Online data upload themselves inline and manage their
  // own save action — only Q&A submits through the shared footer button.
  const showFooter = step === 'select' || (selected === 'qna' && step === 'form');

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl border border-swiss-line shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-swiss-line shrink-0">
          <h3 className="text-base font-bold text-[#111827]">Add knowledge</h3>
          <button type="button" onClick={onClose} className="text-[#6B7280] hover:text-[#111827]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {step === 'select' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelected(opt.id)}
                  className={`text-left p-5 rounded-xl border-2 transition-colors ${
                    selected === opt.id
                      ? 'border-primary bg-primary/10'
                      : 'border-swiss-line hover:border-primary hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">{opt.icon}</div>
                    {opt.badge && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-[#111827]">{opt.title}</p>
                  <p className="text-xs text-[#111827] mt-2">
                    <span className="font-bold">{opt.boldLabel}</span>{' '}
                    <span className="text-[#6B7280]">{opt.description}</span>
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div>
              {selected === 'document' && (
                <DocumentUpload agentId={agentId} onSaved={handleDocumentSaved} />
              )}
              {selected === 'online_data' && (
                <OnlineDataForm agentId={agentId} onSaved={handleOnlineSaved} />
              )}
              {selected === 'qna' && <QnAForm onChange={setQnaPairs} />}
              {selected === 'attachment' && <AttachmentUpload onSaved={handleAttachmentSaved} />}
            </div>
          )}
        </div>

        {showFooter && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-swiss-line shrink-0">
            {step === 'form' ? (
              <button
                type="button"
                onClick={() => setStep('select')}
                className="text-sm font-bold text-[#6B7280] hover:text-[#111827]"
              >
                Back
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              disabled={step === 'select' ? !selected : !canProceed || submitting}
              onClick={() => {
                if (step === 'select' && selected) {
                  setStep('form');
                } else {
                  handleSubmit();
                }
              }}
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl text-sm font-bold"
            >
              {step === 'select' ? 'Next' : submitting ? 'Adding…' : 'Add knowledge'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
