import React, { useState } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import { VariablesDropdown } from './VariablesDropdown';
import { ADD_TAGS_SNIPPET, HANDOFF_SNIPPET } from './constants';
import { insertAtCursor } from './textareaUtils';

type Props = {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
  showHandoff?: boolean;
  showAddTags?: boolean;
  onOpenTemplates: () => void;
  onOpenGuide: () => void;
};

export const InstructionToolbar: React.FC<Props> = ({
  textareaRef,
  value,
  onChange,
  showHandoff = false,
  showAddTags = false,
  onOpenTemplates,
  onOpenGuide,
}) => {
  const insert = (text: string) => insertAtCursor(textareaRef.current, text, value, onChange);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <VariablesDropdown onSelect={(v) => insert(v)} />
          {showHandoff && (
            <button
              type="button"
              onClick={() => insert(`\n${HANDOFF_SNIPPET}\n`)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold border border-black/5 rounded-lg text-[#111827] hover:bg-surface-muted"
            >
              <Plus className="w-3.5 h-3.5" />
              Hand off
            </button>
          )}
          {showAddTags && (
            <button
              type="button"
              onClick={() => insert(`\n${ADD_TAGS_SNIPPET}\n`)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold border border-black/5 rounded-lg text-[#111827] hover:bg-surface-muted"
            >
              <Plus className="w-3.5 h-3.5" />
              Add contact tags
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onOpenTemplates}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold border border-black/5 rounded-lg text-[#111827] hover:bg-surface-muted"
        >
          <Plus className="w-3.5 h-3.5" />
          Add prompt templates
        </button>
      </div>
      <button
        type="button"
        onClick={onOpenGuide}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover"
      >
        <BookOpen className="w-3.5 h-3.5" />
        Learn how to write this
      </button>
    </div>
  );
};
