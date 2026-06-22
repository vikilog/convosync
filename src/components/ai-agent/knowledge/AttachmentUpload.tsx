import React, { useRef, useState } from 'react';
import { Paperclip, Upload } from 'lucide-react';

type Props = {
  onChange: (data: { file: File | null; name: string; description: string }) => void;
};

export const AttachmentUpload: React.FC<Props> = ({ onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const emit = (patch: Partial<{ file: File | null; name: string; description: string }>) => {
    const next = { file, name, description, ...patch };
    setFile(next.file);
    setName(next.name);
    setDescription(next.description);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-8 text-center hover:border-[#0284c7] hover:bg-[#F3F0FF]/30 transition-colors cursor-pointer"
      >
        <Upload className="w-8 h-8 text-sky-600 mx-auto mb-3" />
        <p className="text-sm font-medium text-[#111827]">
          {file ? file.name : 'Upload PDF, image, video, or audio'}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,image/*,video/*,audio/*"
          className="hidden"
          onChange={(e) => emit({ file: e.target.files?.[0] ?? null })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#111827] mb-1.5">Name</label>
        <div className="relative">
          <Paperclip className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
          <input
            type="text"
            value={name}
            onChange={(e) => emit({ name: e.target.value })}
            placeholder="Attachment name"
            className="w-full pl-10 pr-3 py-2.5 border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#111827] mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => emit({ description: e.target.value })}
          placeholder="When should this attachment be sent?"
          rows={3}
          className="w-full border border-[#E5E7EB] rounded-xl py-2.5 px-3 text-sm resize-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] outline-none"
        />
      </div>
    </div>
  );
};
