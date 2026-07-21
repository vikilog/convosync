import React from 'react';
import { X, BookOpen } from 'lucide-react';

type Props = {
  onClose: () => void;
};

export const WritingGuideDrawer: React.FC<Props> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex justify-end">
    <button
      type="button"
      className="absolute inset-0 bg-gray-900/40"
      aria-label="Close guide"
      onClick={onClose}
    />
    <aside className="relative w-full max-w-md bg-surface h-full shadow-2xl flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="text-base font-bold text-[#111827]">Writing guide</h3>
        </div>
        <button type="button" onClick={onClose} className="text-[#6B7280] hover:text-[#111827]">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-5 overflow-y-auto text-sm text-[#111827] space-y-4">
        <section>
          <h4 className="font-bold mb-1">Be specific</h4>
          <p className="text-[#6B7280]">
            Define clear triggers and outcomes. Tell the agent when to act and what to say.
          </p>
        </section>
        <section>
          <h4 className="font-bold mb-1">Use sections</h4>
          <p className="text-[#6B7280]">
            Group instructions into CONTEXT, ROLE, FOLLOW UP, FALLBACK, and BOUNDARIES for
            consistency.
          </p>
        </section>
        <section>
          <h4 className="font-bold mb-1">Variables</h4>
          <p className="text-[#6B7280]">
            Use {'{{contact.name}}'}, {'{{company.name}}'}, and other variables to personalize
            responses without hardcoding data.
          </p>
        </section>
        <section>
          <h4 className="font-bold mb-1">Escalation paths</h4>
          <p className="text-[#6B7280]">
            Always define when to hand off to humans — billing, frustration, and unknown intents
            should have explicit rules.
          </p>
        </section>
        <section>
          <h4 className="font-bold mb-1">Stay grounded</h4>
          <p className="text-[#6B7280]">
            Instruct the agent to only use knowledge base and brand info. Never invent prices or
            policies.
          </p>
        </section>
      </div>
    </aside>
  </div>
);
