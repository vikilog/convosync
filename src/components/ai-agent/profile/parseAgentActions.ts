import type { AgentActionConfig, AgentActionType } from '../types';
import { defaultAgentActions } from './constants';

const LEGACY_MAP: Record<string, AgentActionType> = {
  close_conversations: 'close_conversations',
  escalate: 'escalate_to_human',
  add_tags: 'add_contact_tags',
  update_attributes: 'update_contact_attributes',
};

const VALID_TYPES = new Set<AgentActionType>([
  'close_conversations',
  'escalate_to_human',
  'add_contact_tags',
  'update_contact_attributes',
]);

function isActionConfig(item: unknown): item is AgentActionConfig {
  if (!item || typeof item !== 'object') return false;
  const o = item as Record<string, unknown>;
  return (
    typeof o.type === 'string' &&
    VALID_TYPES.has(o.type as AgentActionType) &&
    typeof o.enabled === 'boolean' &&
    typeof o.instruction === 'string'
  );
}

export function parseAgentActions(raw: unknown): AgentActionConfig[] {
  if (!Array.isArray(raw) || raw.length === 0) return defaultAgentActions();

  if (typeof raw[0] === 'string') {
    const enabledSet = new Set(
      (raw as string[]).map((s) => LEGACY_MAP[s] ?? s).filter((t) => VALID_TYPES.has(t as AgentActionType))
    );
    return defaultAgentActions().map((def) => ({
      ...def,
      enabled: enabledSet.has(def.type),
    }));
  }

  const defaults = defaultAgentActions();
  const byType = new Map<AgentActionType, AgentActionConfig>();
  for (const item of raw) {
    if (isActionConfig(item)) byType.set(item.type, item);
  }
  return defaults.map((def) => byType.get(def.type) ?? def);
}
