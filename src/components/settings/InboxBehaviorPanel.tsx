import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Loader2, Plus, Save, Trash2, Users2 } from 'lucide-react';
import { api } from '../../lib/api';

type Mode = 'off' | 'basic' | 'advanced';

type Member = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
};

type GroupMember = { membershipId: string; userId: string; name: string; email: string };
type Group = { id: string; name: string; members: GroupMember[] };

type BusinessHours = { days: number[]; start: string; end: string; timezone?: string };
type RuleConditions = {
  channels?: string[];
  contactTags?: string[];
  businessHours?: BusinessHours;
};
type Rule = {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  conditions: RuleConditions;
  actionType: 'group' | 'user';
  actionGroupId?: string | null;
  actionUserId?: string | null;
};

const CHANNELS = ['whatsapp', 'instagram', 'messenger'] as const;
const DAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const MODE_CARDS: Array<{ id: Mode; title: string; description: string }> = [
  { id: 'off', title: 'Off', description: 'New conversations stay unassigned until a teammate picks them up.' },
  {
    id: 'basic',
    title: 'Basic — round robin',
    description: 'Evenly rotate new conversations across eligible team members.',
  },
  {
    id: 'advanced',
    title: 'Advanced — rules',
    description: 'Route by channel, contact tags, or business hours, with round robin as fallback.',
  },
];

function emptyRuleForm(): {
  name: string;
  enabled: boolean;
  channels: string[];
  contactTags: string;
  businessHoursEnabled: boolean;
  days: number[];
  start: string;
  end: string;
  actionType: 'group' | 'user';
  actionGroupId: string;
  actionUserId: string;
} {
  return {
    name: '',
    enabled: true,
    channels: [],
    contactTags: '',
    businessHoursEnabled: false,
    days: [1, 2, 3, 4, 5],
    start: '09:00',
    end: '18:00',
    actionType: 'group',
    actionGroupId: '',
    actionUserId: '',
  };
}

function ruleSummary(rule: Rule, groups: Group[], members: Member[]): string {
  const parts: string[] = [];
  if (rule.conditions.channels?.length) parts.push(rule.conditions.channels.join('/'));
  if (rule.conditions.contactTags?.length) parts.push(`tags: ${rule.conditions.contactTags.join(', ')}`);
  if (rule.conditions.businessHours) {
    const bh = rule.conditions.businessHours;
    parts.push(`${bh.start}–${bh.end}`);
  }
  const conditionText = parts.length ? parts.join(' · ') : 'Any conversation';
  const target =
    rule.actionType === 'group'
      ? (groups.find((g) => g.id === rule.actionGroupId)?.name ?? 'Deleted group')
      : (members.find((m) => m.userId === rule.actionUserId)?.name ?? 'Deleted member');
  return `${conditionText} → ${target}`;
}

export function InboxBehaviorPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>('off');
  const [savingMode, setSavingMode] = useState(false);

  const [groups, setGroups] = useState<Group[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const [newGroupName, setNewGroupName] = useState('');
  const [groupMemberPick, setGroupMemberPick] = useState<Record<string, string>>({});

  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState(emptyRuleForm());
  const [savingRule, setSavingRule] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [behavior, groupsRes, rulesRes, membersRes] = await Promise.all([
        api.getInboxBehavior() as Promise<{ mode: Mode }>,
        api.getInboxGroups() as Promise<{ groups: Group[] }>,
        api.getInboxRules() as Promise<{ rules: Rule[] }>,
        api.getWorkspaceMembers() as Promise<Member[]>,
      ]);
      setMode(behavior.mode);
      setGroups(groupsRes.groups);
      setRules(rulesRes.rules);
      setMembers(membersRes);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load Inbox Behavior');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveMode = async (next: Mode) => {
    setSavingMode(true);
    setError(null);
    setMessage(null);
    try {
      await api.updateInboxBehavior({ mode: next });
      setMode(next);
      setMessage('Saved');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update mode');
    } finally {
      setSavingMode(false);
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    setError(null);
    try {
      const group = (await api.createInboxGroup(newGroupName.trim())) as Group;
      setGroups((prev) => [...prev, group]);
      setNewGroupName('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create group');
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!window.confirm('Delete this group? Rules pointing to it will stop matching.')) return;
    setError(null);
    try {
      await api.deleteInboxGroup(groupId);
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete group');
    }
  };

  const addGroupMember = async (groupId: string) => {
    const membershipId = groupMemberPick[groupId];
    if (!membershipId) return;
    setError(null);
    try {
      const updated = (await api.addInboxGroupMember(groupId, membershipId)) as Group;
      setGroups((prev) => prev.map((g) => (g.id === groupId ? updated : g)));
      setGroupMemberPick((prev) => ({ ...prev, [groupId]: '' }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add member');
    }
  };

  const removeGroupMember = async (groupId: string, membershipId: string) => {
    setError(null);
    try {
      const updated = (await api.removeInboxGroupMember(groupId, membershipId)) as Group;
      setGroups((prev) => prev.map((g) => (g.id === groupId ? updated : g)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove member');
    }
  };

  const openNewRuleForm = () => {
    setEditingRuleId(null);
    setRuleForm(emptyRuleForm());
    setShowRuleForm(true);
  };

  const openEditRuleForm = (rule: Rule) => {
    setEditingRuleId(rule.id);
    setRuleForm({
      name: rule.name,
      enabled: rule.enabled,
      channels: rule.conditions.channels ?? [],
      contactTags: (rule.conditions.contactTags ?? []).join(', '),
      businessHoursEnabled: Boolean(rule.conditions.businessHours),
      days: rule.conditions.businessHours?.days ?? [1, 2, 3, 4, 5],
      start: rule.conditions.businessHours?.start ?? '09:00',
      end: rule.conditions.businessHours?.end ?? '18:00',
      actionType: rule.actionType,
      actionGroupId: rule.actionGroupId ?? '',
      actionUserId: rule.actionUserId ?? '',
    });
    setShowRuleForm(true);
  };

  const saveRule = async () => {
    if (!ruleForm.name.trim()) {
      setError('Rule name is required');
      return;
    }
    if (ruleForm.actionType === 'group' && !ruleForm.actionGroupId) {
      setError('Select a group for this rule');
      return;
    }
    if (ruleForm.actionType === 'user' && !ruleForm.actionUserId) {
      setError('Select a team member for this rule');
      return;
    }

    const conditions: RuleConditions = {};
    if (ruleForm.channels.length) conditions.channels = ruleForm.channels;
    const tags = ruleForm.contactTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (tags.length) conditions.contactTags = tags;
    if (ruleForm.businessHoursEnabled) {
      conditions.businessHours = { days: ruleForm.days, start: ruleForm.start, end: ruleForm.end };
    }

    const payload = {
      name: ruleForm.name.trim(),
      enabled: ruleForm.enabled,
      conditions,
      actionType: ruleForm.actionType,
      actionGroupId: ruleForm.actionType === 'group' ? ruleForm.actionGroupId : null,
      actionUserId: ruleForm.actionType === 'user' ? ruleForm.actionUserId : null,
    };

    setSavingRule(true);
    setError(null);
    try {
      if (editingRuleId) {
        const updated = (await api.updateInboxRule(editingRuleId, payload)) as Rule;
        setRules((prev) => prev.map((r) => (r.id === editingRuleId ? updated : r)));
      } else {
        const created = (await api.createInboxRule(payload)) as Rule;
        setRules((prev) => [...prev, created]);
      }
      setShowRuleForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save rule');
    } finally {
      setSavingRule(false);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!window.confirm('Delete this rule?')) return;
    setError(null);
    try {
      await api.deleteInboxRule(ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete rule');
    }
  };

  const toggleRuleEnabled = async (rule: Rule) => {
    setError(null);
    try {
      const updated = (await api.updateInboxRule(rule.id, { enabled: !rule.enabled })) as Rule;
      setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update rule');
    }
  };

  const moveRule = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= rules.length) return;
    const reordered = [...rules];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setRules(reordered);
    setError(null);
    try {
      const res = (await api.reorderInboxRules(reordered.map((r) => r.id))) as { rules: Rule[] };
      setRules(res.rules);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reorder rules');
      void load();
    }
  };

  const groupsById = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups]);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-1">
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        {MODE_CARDS.map((card) => {
          const active = mode === card.id;
          return (
            <button
              key={card.id}
              type="button"
              disabled={savingMode}
              onClick={() => void saveMode(card.id)}
              className={`flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-colors disabled:opacity-60 ${
                active
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                  : 'border-border-subtle bg-white hover:border-primary/40'
              }`}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="text-sm font-semibold text-dark-navy">{card.title}</span>
                {active ? <Check className="h-4 w-4 text-primary" /> : null}
              </span>
              <span className="text-xs text-slate-500">{card.description}</span>
            </button>
          );
        })}
      </section>

      {mode === 'advanced' ? (
        <>
          <section className="space-y-3 rounded-xl border-[0.5px] border-border-subtle bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-dark-navy">
                  <Users2 className="h-4 w-4 text-primary" /> Groups
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Route a rule to a group and it round-robins among that group's eligible members.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="New group name"
                className="flex-1 rounded-lg border-[0.5px] border-border-subtle bg-surface px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void createGroup()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                <Plus className="h-4 w-4" /> Add group
              </button>
            </div>

            <div className="space-y-2">
              {groups.map((group) => {
                const memberIds = new Set(group.members.map((m) => m.membershipId));
                const available = members.filter((m) => !memberIds.has(m.id));
                return (
                  <div
                    key={group.id}
                    className="rounded-lg border-[0.5px] border-border-subtle bg-surface p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-dark-navy">{group.name}</span>
                      <button
                        type="button"
                        onClick={() => void deleteGroup(group.id)}
                        className="text-slate-400 hover:text-rose-600"
                        aria-label="Delete group"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {group.members.map((m) => (
                        <span
                          key={m.membershipId}
                          className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-border-subtle"
                        >
                          {m.name}
                          <button
                            type="button"
                            onClick={() => void removeGroupMember(group.id, m.membershipId)}
                            className="text-slate-400 hover:text-rose-600"
                            aria-label={`Remove ${m.name}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {group.members.length === 0 ? (
                        <span className="text-xs text-slate-400">No members yet.</span>
                      ) : null}
                    </div>
                    {available.length > 0 ? (
                      <div className="mt-2 flex gap-2">
                        <select
                          value={groupMemberPick[group.id] ?? ''}
                          onChange={(e) =>
                            setGroupMemberPick((prev) => ({ ...prev, [group.id]: e.target.value }))
                          }
                          className="flex-1 rounded-lg border-[0.5px] border-border-subtle bg-white px-2 py-1.5 text-sm"
                        >
                          <option value="">Add member…</option>
                          {available.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => void addGroupMember(group.id)}
                          className="rounded-lg border-[0.5px] border-border-subtle px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/5"
                        >
                          Add
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {groups.length === 0 ? (
                <p className="text-xs text-slate-400">No groups yet — create one to target it from a rule.</p>
              ) : null}
            </div>
          </section>

          <section className="space-y-3 rounded-xl border-[0.5px] border-border-subtle bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-dark-navy">Rules</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Evaluated top to bottom. First match wins. No match falls back to Basic round robin.
                </p>
              </div>
              <button
                type="button"
                onClick={openNewRuleForm}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                <Plus className="h-4 w-4" /> Add rule
              </button>
            </div>

            <div className="space-y-2">
              {rules.map((rule, index) => (
                <div
                  key={rule.id}
                  className={`flex items-center justify-between gap-3 rounded-lg border-[0.5px] p-3 ${
                    rule.enabled ? 'border-border-subtle bg-surface' : 'border-border-subtle bg-surface opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => void moveRule(index, -1)}
                        className="text-slate-400 hover:text-primary disabled:opacity-30"
                        aria-label="Move up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === rules.length - 1}
                        onClick={() => void moveRule(index, 1)}
                        className="text-slate-400 hover:text-primary disabled:opacity-30"
                        aria-label="Move down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-dark-navy">{rule.name}</p>
                      <p className="text-xs text-slate-500">{ruleSummary(rule, groups, members)}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-600">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => void toggleRuleEnabled(rule)}
                        className="h-3.5 w-3.5 accent-primary"
                      />
                      Enabled
                    </label>
                    <button
                      type="button"
                      onClick={() => openEditRuleForm(rule)}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteRule(rule.id)}
                      className="text-slate-400 hover:text-rose-600"
                      aria-label="Delete rule"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {rules.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No rules yet — unmatched conversations fall back to Basic round robin.
                </p>
              ) : null}
            </div>
          </section>
        </>
      ) : null}

      {showRuleForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div
            className="absolute inset-0"
            onClick={() => !savingRule && setShowRuleForm(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-lg space-y-4 rounded-2xl border border-black/5 bg-surface p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black text-gray-950">
              {editingRuleId ? 'Edit rule' : 'New rule'}
            </h3>

            <label className="block space-y-1">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Name</span>
              <input
                value={ruleForm.name}
                onChange={(e) => setRuleForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-xl border border-black/5 px-3 py-2 text-sm"
              />
            </label>

            <div className="space-y-1.5">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Channels</span>
              <div className="flex gap-3">
                {CHANNELS.map((ch) => (
                  <label key={ch} className="flex items-center gap-1.5 text-sm capitalize">
                    <input
                      type="checkbox"
                      checked={ruleForm.channels.includes(ch)}
                      onChange={(e) =>
                        setRuleForm((prev) => ({
                          ...prev,
                          channels: e.target.checked
                            ? [...prev.channels, ch]
                            : prev.channels.filter((c) => c !== ch),
                        }))
                      }
                      className="h-4 w-4 accent-primary"
                    />
                    {ch}
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-400">Leave empty to match any channel.</p>
            </div>

            <label className="block space-y-1">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                Contact tags (any match)
              </span>
              <input
                value={ruleForm.contactTags}
                onChange={(e) => setRuleForm((prev) => ({ ...prev, contactTags: e.target.value }))}
                placeholder="vip, priority"
                className="w-full rounded-xl border border-black/5 px-3 py-2 text-sm"
              />
              <span className="text-xs text-slate-400">Comma-separated. Leave empty to match any contact.</span>
            </label>

            <div className="space-y-2 rounded-xl border-[0.5px] border-border-subtle p-3">
              <label className="flex cursor-pointer items-center justify-between gap-2">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                  Business hours
                </span>
                <input
                  type="checkbox"
                  checked={ruleForm.businessHoursEnabled}
                  onChange={(e) =>
                    setRuleForm((prev) => ({ ...prev, businessHoursEnabled: e.target.checked }))
                  }
                  className="h-4 w-4 accent-primary"
                />
              </label>
              {ruleForm.businessHoursEnabled ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((d) => (
                      <label key={d.value} className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={ruleForm.days.includes(d.value)}
                          onChange={(e) =>
                            setRuleForm((prev) => ({
                              ...prev,
                              days: e.target.checked
                                ? [...prev.days, d.value]
                                : prev.days.filter((v) => v !== d.value),
                            }))
                          }
                          className="h-3.5 w-3.5 accent-primary"
                        />
                        {d.label}
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={ruleForm.start}
                      onChange={(e) => setRuleForm((prev) => ({ ...prev, start: e.target.value }))}
                      className="rounded-lg border-[0.5px] border-border-subtle px-2 py-1.5 text-sm"
                    />
                    <span className="text-xs text-slate-400">to</span>
                    <input
                      type="time"
                      value={ruleForm.end}
                      onChange={(e) => setRuleForm((prev) => ({ ...prev, end: e.target.value }))}
                      className="rounded-lg border-[0.5px] border-border-subtle px-2 py-1.5 text-sm"
                    />
                  </div>
                  <p className="text-xs text-slate-400">Uses the workspace's Inbox Behavior timezone.</p>
                </>
              ) : null}
            </div>

            <div className="space-y-2">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Assign to</span>
              <div className="flex gap-3">
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="radio"
                    checked={ruleForm.actionType === 'group'}
                    onChange={() => setRuleForm((prev) => ({ ...prev, actionType: 'group' }))}
                    className="h-4 w-4 accent-primary"
                  />
                  Group
                </label>
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="radio"
                    checked={ruleForm.actionType === 'user'}
                    onChange={() => setRuleForm((prev) => ({ ...prev, actionType: 'user' }))}
                    className="h-4 w-4 accent-primary"
                  />
                  Specific member
                </label>
              </div>
              {ruleForm.actionType === 'group' ? (
                <select
                  value={ruleForm.actionGroupId}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, actionGroupId: e.target.value }))}
                  className="w-full rounded-xl border border-black/5 bg-surface px-3 py-2 text-sm"
                >
                  <option value="">Select a group…</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.members.length})
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={ruleForm.actionUserId}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, actionUserId: e.target.value }))}
                  className="w-full rounded-xl border border-black/5 bg-surface px-3 py-2 text-sm"
                >
                  <option value="">Select a member…</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.userId}>
                      {m.name}
                    </option>
                  ))}
                </select>
              )}
              {ruleForm.actionType === 'group' && ruleForm.actionGroupId
                ? groupsById.get(ruleForm.actionGroupId)?.members.length === 0
                  ? (
                    <p className="text-xs text-amber-600">This group has no members yet.</p>
                  )
                  : null
                : null}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRuleForm(false)}
                disabled={savingRule}
                className="rounded-xl px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveRule()}
                disabled={savingRule}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {savingRule ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save rule
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
