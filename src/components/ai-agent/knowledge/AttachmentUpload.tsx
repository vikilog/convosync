import React, { useRef, useState } from 'react';
import { Paperclip, Upload } from 'lucide-react';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';

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
        className="border-2 border-dashed border-swiss-line rounded-xl p-8 text-center hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
      >
        <Upload className="w-8 h-8 text-primary mx-auto mb-3" />
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
          <Input
            type="text"
            value={name}
            onChange={(e) => emit({ name: e.target.value })}
            placeholder="Attachment name"
            className="h-auto w-full pl-10 pr-3 py-2.5 border border-swiss-line rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#111827] mb-1.5">Description</label>
        <Textarea
          value={description}
          onChange={(e) => emit({ description: e.target.value })}
          placeholder="When should this attachment be sent?"
          rows={3}
          className="min-h-0 w-full border border-swiss-line rounded-xl py-2.5 px-3 text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
        />
      </div>
    </div>
  );
};
