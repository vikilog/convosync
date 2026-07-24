/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, ChevronLeft, Route, Sparkles, User, UserX } from 'lucide-react';

type AgentOption = { id: string; name: string };
type BotOption = { id: string; name: string };
type JourneyOption = { id: string; name: string };

type InboxAssigneePickerProps = {
  value: string;
  teamAgents: AgentOption[];
  aiAgents: AgentOption[];
  ruleBasedBots: BotOption[];
  publishedJourneys: JourneyOption[];
  onChange: (value: string) => void;
};

function decodeAssigneeValue(value: string): {
  assigneeType: string | null;
  assigneeId: string | null;
} {
  if (!value) return { assigneeType: null, assigneeId: null };
  if (value === 'ai') return { assigneeType: 'ai', assigneeId: null };
  const colon = value.indexOf(':');
  if (colon === -1) return { assigneeType: null, assigneeId: null };
  return {
    assigneeType: value.slice(0, colon),
    assigneeId: value.slice(colon + 1) || null,
  };
}

function assigneeLabelFromValue(
  value: string,
  teamAgents: AgentOption[],
  aiAgents: AgentOption[],
  ruleBasedBots: BotOption[],
  journeys: JourneyOption[]
): string {
  if (!value) return 'Unassigned';
  if (value === 'ai') return 'AI Copilot';
  const { assigneeType, assigneeId } = decodeAssigneeValue(value);
  if (assigneeType === 'user') {
    return teamAgents.find((a) => a.id === assigneeId)?.name ?? 'Team member';
  }
  if (assigneeType === 'ai_agent') {
    return aiAgents.find((a) => a.id === assigneeId)?.name ?? 'AI Agent';
  }
  if (assigneeType === 'rule_based') {
    return ruleBasedBots.find((b) => b.id === assigneeId)?.name ?? 'Bot';
  }
  if (assigneeType === 'journey') {
    return journeys.find((j) => j.id === assigneeId)?.name ?? 'Journey';
  }
  return 'Unassigned';
}

type Submenu = 'main' | 'ai_agents' | 'journeys';

export function InboxAssigneePicker({
  value,
  teamAgents,
  aiAgents,
  ruleBasedBots,
  publishedJourneys,
  onChange,
}: InboxAssigneePickerProps) {
  const [open, setOpen] = useState(false);
  const [submenu, setSubmenu] = useState<Submenu>('main');
  const rootRef = useRef<HTMLDivElement>(null);

  const displayLabel = assigneeLabelFromValue(
    value,
    teamAgents,
    aiAgents,
    ruleBasedBots,
    publishedJourneys
  );

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setSubmenu('main');
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const pick = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
    setSubmenu('main');
  };

  const itemClass =
    'w-full text-left px-3 py-2.5 text-sm font-bold text-gray-800 hover:bg-sky-50 transition-colors flex items-center gap-2.5';

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          if (open) setSubmenu('main');
        }}
        className="flex items-center gap-1 bg-transparent border-none text-sm font-bold text-gray-800 focus:ring-0 outline-none p-0 cursor-pointer max-w-[180px]"
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-40 w-64 bg-surface border border-black/5 rounded-xl shadow-xl overflow-hidden"
          >
            {submenu === 'main' && (
              <div className="py-1">
                <button type="button" onClick={() => pick('')} className={itemClass}>
                  <UserX className="w-4 h-4 text-gray-400 shrink-0" />
                  Unassigned
                </button>

                {teamAgents.length > 0 && (
                  <>
                    <div className="px-3 pt-2 pb-1 text-meta font-black uppercase tracking-wider text-gray-400">
                      Team
                    </div>
                    {teamAgents.map((agent) => (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => pick(`user:${agent.id}`)}
                        className={`${itemClass} ${value === `user:${agent.id}` ? 'bg-sky-50 text-sky-600' : ''}`}
                      >
                        <User className="w-4 h-4 text-sky-600 shrink-0" />
                        <span className="truncate">{agent.name}</span>
                      </button>
                    ))}
                  </>
                )}

                <div className="px-3 pt-2 pb-1 text-meta font-black uppercase tracking-wider text-gray-400">
                  Automation
                </div>

                <button
                  type="button"
                  onClick={() => setSubmenu('ai_agents')}
                  className={`${itemClass} justify-between`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
                    AI Agent
                  </span>
                  <span className="text-xs text-gray-400 font-bold shrink-0">
                    {aiAgents.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubmenu('journeys')}
                  className={`${itemClass} justify-between`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Route className="w-4 h-4 text-sky-600 shrink-0" />
                    Automation Journey
                  </span>
                  <span className="text-xs text-gray-400 font-bold shrink-0">
                    {publishedJourneys.length}
                  </span>
                </button>
              </div>
            )}

            {submenu === 'ai_agents' && (
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => setSubmenu('main')}
                  className={`${itemClass} text-gray-500 border-b border-black/5`}
                >
                  <ChevronLeft className="w-4 h-4 shrink-0" />
                  Back
                </button>
                <div className="px-3 py-2 text-meta font-black uppercase tracking-wider text-gray-400">
                  Select AI agent
                </div>
                {aiAgents.length === 0 ? (
                  <p className="px-3 py-3 text-meta text-gray-400 font-medium">
                    No published AI agents yet. Publish one from AI Agent.
                  </p>
                ) : (
                  aiAgents.map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => pick(`ai_agent:${agent.id}`)}
                      className={`${itemClass} ${value === `ai_agent:${agent.id}` ? 'bg-sky-50 text-sky-600' : ''}`}
                    >
                      <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
                      <span className="truncate">{agent.name}</span>
                    </button>
                  ))
                )}
              </div>
            )}

            {submenu === 'journeys' && (
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => setSubmenu('main')}
                  className={`${itemClass} text-gray-500 border-b border-black/5`}
                >
                  <ChevronLeft className="w-4 h-4 shrink-0" />
                  Back
                </button>
                <div className="px-3 py-2 text-meta font-black uppercase tracking-wider text-gray-400">
                  Select journey
                </div>
                {publishedJourneys.length === 0 ? (
                  <p className="px-3 py-3 text-meta text-gray-400 font-medium">
                    No published journeys yet.
                  </p>
                ) : (
                  publishedJourneys.map((journey) => (
                    <button
                      key={journey.id}
                      type="button"
                      onClick={() => pick(`journey:${journey.id}`)}
                      className={`${itemClass} ${value === `journey:${journey.id}` ? 'bg-sky-50 text-sky-600' : ''}`}
                    >
                      <Route className="w-4 h-4 text-sky-600 shrink-0" />
                      <span className="truncate">{journey.name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
