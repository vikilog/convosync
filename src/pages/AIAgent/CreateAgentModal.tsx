import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import type { AgentType } from '../../components/ai-agent/types';
import { CATEGORY_LABELS } from '../../components/ai-agent/types';
import { AGENT_TYPE_OPTIONS } from '../../components/ai-agent/AgentTypeSelector';

type Props = {
  category: AgentType;
  name: string;
  creating: boolean;
  onNameChange: (name: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

export const CreateAgentModal: React.FC<Props> = ({
  category,
  name,
  creating,
  onNameChange,
  onClose,
  onSubmit,
}) => (
  <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <motion.div
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.96, opacity: 0 }}
      className="bg-surface rounded-2xl w-full max-w-md border border-black/5 p-6 shadow-2xl"
    >
      <div className="flex justify-between items-start pb-4 border-b border-gray-100">
        <div>
          <p className="text-sm font-black uppercase tracking-wider text-primary mb-1">
            {CATEGORY_LABELS[category]}
          </p>
          <h4 className="font-bold text-[#111827] text-sm">Name your agent</h4>
          <p className="text-xs text-[#6B7280] mt-1">
            {AGENT_TYPE_OPTIONS.find((c) => c.id === category)?.description}
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-[#6B7280] hover:text-[#111827]">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 mt-4">
        <div>
          <label className="block text-sm font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">
            Agent name
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. Support Bot"
            className="w-full bg-surface-muted border border-black/5 rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={creating || !name.trim()}
          className="w-full py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all"
        >
          {creating ? 'Creating…' : 'Create Agent'}
        </button>
      </form>
    </motion.div>
  </div>
);
