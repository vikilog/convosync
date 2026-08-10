import React, { useState } from 'react';
import { X, Search } from 'lucide-react';

export type SkillDraft = {
  title: string;
  trigger: string;
  instructions: string;
};

type Props = {
  onClose: () => void;
  onCreate: (draft: SkillDraft) => void;
  creating?: boolean;
};

const SUGGESTED_SKILLS: SkillDraft[] = [
  {
    title: 'Send media',
    trigger:
      'User asks for a brochure, catalog, menu, price list, PDF, image, photo, flyer, document, sample, download, or says file bhejo / send me the …',
    instructions: `When the user wants a file, image, brochure, catalog, menu, price list, or document — or when related media may help:
1. Answer the question briefly first.
2. Pricing / explicit "bhejo/send" requests: the system may attach the file automatically — keep text short.
3. Feature/product questions with related media: the system may ask "Bhej doon?" — do not invent files or fake links.
4. If nothing relevant is available, do not invent a file; offer human help if needed.
5. Reply in the user's language (English or Hinglish).`,
  },
  {
    title: 'Order tracking',
    trigger: 'User asks where their order is, tracking status, delivery ETA, or shipment update.',
    instructions:
      'Ask for the order ID if missing. Share tracking status from knowledge/CRM only. Never invent a tracking number or ETA.',
  },
  {
    title: 'Refund request',
    trigger: 'User wants a refund, return, chargeback, or money back.',
    instructions:
      'Collect order ID and reason. Explain the refund policy from knowledge only. Escalate billing disputes or angry customers.',
  },
  {
    title: 'Product inquiry',
    trigger: 'User asks about a product, features, availability, or how something works.',
    instructions:
      'Answer from knowledge base only. Keep replies short. Offer Send media when a brochure/catalog would help.',
  },
  {
    title: 'Appointment booking',
    trigger: 'User wants to book, reschedule, or cancel an appointment or demo call.',
    instructions:
      'Collect name, preferred time, and use-case. Confirm next steps. Escalate if calendar is unavailable.',
  },
  {
    title: 'FAQ handling',
    trigger: 'User asks a common FAQ covered in the knowledge base.',
    instructions:
      'Answer briefly from knowledge. If not covered, say so and offer human handoff — do not invent facts.',
  },
];

export const NewSkillModal: React.FC<Props> = ({ onClose, onCreate, creating }) => {
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [selected, setSelected] = useState<SkillDraft | null>(null);

  const filtered = SUGGESTED_SKILLS.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    const name = title.trim() || search.trim();
    if (!name) return;
    if (selected && selected.title === name) {
      onCreate(selected);
      return;
    }
    onCreate({ title: name, trigger: '', instructions: '' });
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md border border-black/5 shadow-2xl">
        <div className="flex justify-between items-center px-6 py-4 border-b border-black/5">
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
              className="w-full pl-10 pr-3 py-2.5 border border-black/5 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1.5">Skill title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSelected(null);
              }}
              placeholder="Enter title here"
              className="w-full border border-black/5 rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          {filtered.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wide">Suggestions</p>
              {filtered.map((s) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => {
                    setTitle(s.title);
                    setSelected(s);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selected?.title === s.title
                      ? 'bg-primary/15 text-[#111827] font-medium'
                      : 'text-[#111827] hover:bg-primary/10'
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            disabled={creating || (!title.trim() && !search.trim())}
            onClick={handleCreate}
            className="w-full py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-xl text-sm font-bold"
          >
            {creating ? 'Creating…' : 'Create Skill'}
          </button>
        </div>
      </div>
    </div>
  );
};
