import React, { useRef, useState } from 'react';
import { CheckCircle2, FileText, Loader2, Upload, X, AlertCircle } from 'lucide-react';
import { api } from '../../../lib/api';
import type { KnowledgeItem } from '../types';

const ACCEPTED = '.pdf,.docx,.txt,.md,text/markdown';
const ALLOWED = /\.(pdf|docx|txt|md)$/i;

type UploadEntry = {
  id: string;
  file: File;
  status: 'uploading' | 'done' | 'error';
  error?: string;
};

type Props = {
  agentId: string;
  onSaved: (item: KnowledgeItem) => void;
};

function mapUploadedItem(raw: Record<string, unknown>): KnowledgeItem {
  return {
    id: String(raw.id),
    agentId: String(raw.agentId),
    type: 'document',
    title: String(raw.title),
    content: raw.content ? String(raw.content) : null,
    url: null,
    fileUrl: null,
    status: 'ready',
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

function errorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : '';
  return message || 'Upload failed — please try again.';
}

export const DocumentUpload: React.FC<Props> = ({ agentId, onSaved }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<UploadEntry[]>([]);

  const uploadOne = async (entry: UploadEntry) => {
    try {
      const item = await api.uploadAgentKnowledgeDocument(agentId, entry.file);
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, status: 'done' } : e))
      );
      onSaved(mapUploadedItem(item as Record<string, unknown>));
    } catch (err) {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entry.id ? { ...e, status: 'error', error: errorMessage(err) } : e
        )
      );
    }
  };

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const picked = Array.from(incoming).filter((f) => ALLOWED.test(f.name));
    if (!picked.length) return;

    const newEntries: UploadEntry[] = picked.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      status: 'uploading',
    }));
    setEntries((prev) => [...prev, ...newEntries]);
    newEntries.forEach((entry) => void uploadOne(entry));
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
        className="border-2 border-dashed border-swiss-line rounded-xl p-8 text-center hover:border-swiss-accent hover:bg-swiss-accent/5 transition-colors cursor-pointer"
      >
        <Upload className="w-8 h-8 text-swiss-accent mx-auto mb-3" />
        <p className="text-sm font-medium text-[#111827]">Drag & drop or click to browse</p>
        <p className="text-xs text-[#6B7280] mt-1">PDF, DOCX, TXT, MD — uploads immediately</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {entries.length > 0 && (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-3 px-3 py-2 bg-white border border-swiss-line rounded-xl"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <FileText className="w-4 h-4 text-swiss-accent shrink-0" />
                <div className="min-w-0">
                  <span className="text-sm text-[#111827] truncate block">
                    {entry.file.name}
                  </span>
                  {entry.status === 'error' && (
                    <span className="text-xs text-red-600">{entry.error}</span>
                  )}
                </div>
              </div>
              {entry.status === 'uploading' && (
                <Loader2 className="w-4 h-4 text-swiss-accent animate-spin shrink-0" />
              )}
              {entry.status === 'done' && (
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              )}
              {entry.status === 'error' && (
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              )}
              <button
                type="button"
                onClick={() => removeEntry(entry.id)}
                className="text-[#6B7280] hover:text-red-500 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
