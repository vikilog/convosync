import React, { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';

const VARIABLES = [
  { label: 'Contact Name', value: '{{contact.name}}' },
  { label: 'Contact Phone', value: '{{contact.phone}}' },
  { label: 'Contact Email', value: '{{contact.email}}' },
  { label: 'Company Name', value: '{{company.name}}' },
  { label: 'Agent Name', value: '{{agent.name}}' },
  { label: 'Conversation ID', value: '{{conversation.id}}' },
  { label: 'Current Date', value: '{{current.date}}' },
  { label: 'Current Time', value: '{{current.time}}' },
];

type Props = {
  onSelect: (variable: string) => void;
};

export const VariablesDropdown: React.FC<Props> = ({ onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold border border-[#E5E7EB] rounded-lg text-[#111827] hover:bg-[#F8FAFC]"
      >
        <Plus className="w-3.5 h-3.5" />
        Variables
      </button>
      {open && (
        <div className="absolute left-0 bottom-full mb-1 w-52 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-20 py-1 max-h-56 overflow-y-auto">
          {VARIABLES.map((v) => (
            <button
              key={v.value}
              type="button"
              onClick={() => {
                onSelect(v.value);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs hover:bg-[#F3F0FF] transition-colors"
            >
              <span className="font-semibold text-[#111827]">{v.label}</span>
              <span className="block text-[#6B7280] font-mono mt-0.5">{v.value}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
