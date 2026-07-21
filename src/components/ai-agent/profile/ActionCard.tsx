import React, { useRef } from 'react';
import { Bot } from 'lucide-react';
import type { AgentActionConfig, AgentActionType } from '../types';
import { ACTION_META, ACTION_PLACEHOLDERS } from './constants';
import { InstructionToolbar } from './InstructionToolbar';

type Props = {
  action: AgentActionConfig;
  onChange: (patch: Partial<AgentActionConfig>) => void;
  onOpenTemplates: (type: AgentActionType) => void;
  onOpenGuide: () => void;
};

export const ActionCard: React.FC<Props> = ({
  action,
  onChange,
  onOpenTemplates,
  onOpenGuide,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const meta = ACTION_META[action.type];
  const placeholder = ACTION_PLACEHOLDERS[action.type];

  return (
    <div className="bg-surface border border-black/5 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-[#111827]">{meta.title}</h4>
          <p className="text-xs text-[#6B7280] mt-1">{meta.description}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={action.enabled}
          onClick={() => onChange({ enabled: !action.enabled })}
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
            action.enabled ? 'bg-primary' : 'bg-[#D1D5DB]'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              action.enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {action.enabled && (
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-[#111827]">
            When and how should this action be performed?
          </label>
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={action.instruction}
              onChange={(e) => onChange({ instruction: e.target.value.slice(0, 1000) })}
              placeholder={placeholder}
              rows={6}
              className="w-full border border-black/5 bg-surface-muted rounded-lg py-3 px-3 pr-10 text-sm resize-y min-h-[120px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
            <span className="absolute bottom-3 right-3 text-xs text-[#6B7280]">
              {action.instruction.length}/1000
            </span>
            <Bot className="absolute bottom-3 right-16 w-4 h-4 text-[#6B7280]" />
          </div>
          <InstructionToolbar
            textareaRef={textareaRef}
            value={action.instruction}
            onChange={(v) => onChange({ instruction: v })}
            showHandoff={meta.showHandoff}
            showAddTags={meta.showAddTags}
            onOpenTemplates={() => onOpenTemplates(action.type)}
            onOpenGuide={onOpenGuide}
          />
        </div>
      )}
    </div>
  );
};
