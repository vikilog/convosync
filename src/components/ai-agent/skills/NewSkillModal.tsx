import React, { useState } from 'react';
import { X, Search } from 'lucide-react';

type Props = {
  onClose: () => void;
  onCreate: (title: string) => void;
  creating?: boolean;
};

const SUGGESTED_SKILLS = [
  'Order tracking',
  'Refund request',
  'Product inquiry',
  'Appointment booking',
  'FAQ handling',
];

export const NewSkillModal: React.FC<Props> = ({ onClose, onCreate, creating }) => {
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');

  const filtered = SUGGESTED_SKILLS.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    const name = title.trim() || search.trim();
    if (!name) return;
    onCreate(name);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md border border-[#E5E7EB] shadow-2xl">
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#E5E7EB]">
          <h3 className="text-base font-bold text-[#111827]">New Skill</h3>
          <button type="button" onClick={onClose} className="text-[#6B7280] hover:text-[#111827]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skills or enter a name"
              className="w-full pl-10 pr-3 py-2.5 border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1.5">Skill title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title here"
              className="w-full border border-[#E5E7EB] rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] outline-none"
            />
          </div>

          {filtered.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wide">Suggestions</p>
              {filtered.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTitle(s)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-[#111827] hover:bg-[#F3F0FF] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            disabled={creating || (!title.trim() && !search.trim())}
            onClick={handleCreate}
            className="w-full py-2.5 bg-[#1E1B2E] hover:bg-black disabled:opacity-60 text-white rounded-xl text-sm font-bold"
          >
            {creating ? 'Creating…' : 'Create Skill'}
          </button>
        </div>
      </div>
    </div>
  );
};
