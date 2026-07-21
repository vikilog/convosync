import React from 'react';
import { Bot } from 'lucide-react';
import type { AgentType } from './types';

export type AgentTypeOption = {
  id: AgentType;
  title: string;
  description: string;
  iconClass: string;
};

export const AGENT_TYPE_OPTIONS: AgentTypeOption[] = [
  {
    id: 'ai_agent',
    title: 'AI Agent',
    description:
      'Configure agent behavior through system instructions for personalized and scenario-specific automation.',
    iconClass: 'text-primary bg-primary/10',
  },
  // Responsive AI Agent — hidden for now
  // {
  //   id: 'responsive',
  //   title: 'Responsive AI Agent',
  //   description:
  //     "Triggered by the client's inbound messages, ideal for solving questions in real time.",
  //   iconClass: 'text-blue-600 bg-blue-50',
  // },
  // Rule-based Agent — hidden for now
  // {
  //   id: 'rule_based',
  //   title: 'Rule-based Agent',
  //   description: 'No AI, just simple flow-based behavior, ideal for routine tasks.',
  //   iconClass: 'text-gray-600 bg-gray-100',
  // },
];

type Props = {
  onSelect: (type: AgentType) => void;
};

export const AgentTypeSelector: React.FC<Props> = ({ onSelect }) => (
  <div className="w-[320px] bg-surface border border-black/5 rounded-xl shadow-xl overflow-hidden">
    {AGENT_TYPE_OPTIONS.map((option) => (
      <button
        key={option.id}
        type="button"
        onClick={() => onSelect(option.id)}
        className="w-full text-left px-4 py-4 hover:bg-primary/10 border-b border-gray-100 last:border-b-0 transition-colors flex gap-3"
      >
        <div className={`p-2 rounded-full shrink-0 h-fit ${option.iconClass}`}>
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#111827]">{option.title}</p>
          <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">{option.description}</p>
        </div>
      </button>
    ))}
  </div>
);
