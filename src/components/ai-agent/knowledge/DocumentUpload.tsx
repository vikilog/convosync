import React, { useRef, useState } from 'react';
import { FileText, Upload, X } from 'lucide-react';

const ACCEPTED = '.pdf,.doc,.docx,.txt,.md,text/markdown';

type Props = {
  onFilesChange: (files: File[]) => void;
};

export const DocumentUpload: React.FC<Props> = ({ onFilesChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const allowed = /\.(pdf|doc|docx|txt|md)$/i;
    const picked = Array.from(incoming).filter((f) => allowed.test(f.name));
    if (!picked.length) return;
    const next = [...files, ...picked];
    setFiles(next);
    onFilesChange(next);
  };

  const removeFile = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    onFilesChange(next);
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
        className="border-2 border-dashed border-black/5 rounded-xl p-8 text-center hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
      >
        <Upload className="w-8 h-8 text-primary mx-auto mb-3" />
        <p className="text-sm font-medium text-[#111827]">Drag & drop or click to browse</p>
        <p className="text-xs text-[#6B7280] mt-1">PDF, DOC, DOCX, TXT, MD</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center justify-between gap-3 px-3 py-2 bg-surface-muted border border-black/5 rounded-xl"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm text-[#111827] truncate">{file.name}</span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="text-[#6B7280] hover:text-red-500"
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
