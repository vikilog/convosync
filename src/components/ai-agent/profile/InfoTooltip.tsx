import React, { useId } from 'react';
import { HelpCircle } from 'lucide-react';

type Props = {
  text: string;
};

export const InfoTooltip: React.FC<Props> = ({ text }) => {
  const id = useId();
  return (
    <span className="relative inline-flex group">
      <button
        type="button"
        aria-describedby={id}
        className="text-[#6B7280] hover:text-sky-600 transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 px-3 py-2 text-xs text-white bg-[#111827] rounded-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-30 shadow-lg"
      >
        {text}
      </span>
    </span>
  );
};
