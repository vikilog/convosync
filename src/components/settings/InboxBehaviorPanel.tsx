import { useState } from 'react'
import { ArrowDown, ArrowUp, GitBranch, Loader2, Plus, Shuffle, Trash2, X } from 'lucide-react'

import { InboxRuleFormSheet } from '@/components/settings/InboxRuleFormSheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { inboxRuleSummary } from '@/lib/inboxRuleForm'
import { listTimezoneOptions } from '@/lib/locale/timezones'
import { realWorkspaceMembersService } from '@/services/realWorkspaceMembers.service'
import {
  realWorkspaceSettingsService,
  type InboxAssignmentMode,
  type InboxRule,
} from '@/services/realWorkspaceSettings.service'

const MODES: {
  id: InboxAssignmentMode
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { id: 'off', label: 'Off', description: 'Conversations stay unassigned.', icon: X },
  { id: 'basic', label: 'Basic', description: 'Round-robin across the whole team.', icon: Shuffle },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'Rules based on channel, tag, and hours.',
    icon: GitBranch,
  },
]

function GroupsCard() {
  const { data } = realWorkspaceSettingsService.useInboxGroups()
  const { data: membersData } = realWorkspaceMembersService.useList()
  const createGroup = realWorkspaceSettingsService.useCreateInboxGroup()
  const deleteGroup = realWorkspaceSettingsService.useDeleteInboxGroup()
  const addMember = realWorkspaceSettingsService.useAddInboxGroupMember()
  const removeMember = realWorkspaceSettingsService.useRemoveInboxGroupMember()

  const [newGroupName, setNewGroupName] = useState('')
  const groups = data?.groups ?? []
  const members = membersData ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team groups</CardTitle>
        <p className="text-muted-foreground text-xs">Used as rule actions below.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {groups.map((group) => (
          <div key={group.id} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{group.name}</p>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => deleteGroup.mutate(group.id)}
                aria-label={`Delete ${group.name}`}
              >
                <Trash2 />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {group.members.map((m) => (
                <Badge key={m.membershipId} variant="secondary" className="gap-1">
                  {m.name}
                  <button
                    type="button"
                    onClick={() => removeMember.mutate({ groupId: group.id, membershipId: m.membershipId })}
                    aria-label={`Remove ${m.name}`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Select
              value=""
              onValueChange={(membershipId) => addMember.mutate({ groupId: group.id, membershipId })}
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue placeholder="Add member…" />
              </SelectTrigger>
              <SelectContent>
                {members
                  .filter((m) => !group.members.some((gm) => gm.membershipId === m.id))
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        <div className="flex gap-2">
          <Input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="New group name"
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            disabled={!newGroupName.trim()}
            onClick={() => {
              createGroup.mutate(newGroupName.trim())
              setNewGroupName('')
            }}
          >
            <Plus />
            Add group
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function RuleRow({
  rule,
  index,
  total,
  groups,
  members,
  onEdit,
}: {
  rule: InboxRule
  index: number
  total: number
  groups: { id: string; name: string }[]
  members: { userId: string; name: string }[]
  onEdit: () => void
}) {
  const update = realWorkspaceSettingsService.useUpdateInboxRule()
  const remove = realWorkspaceSettingsService.useDeleteInboxRule()
  const reorder = realWorkspaceSettingsService.useReorderInboxRules()
  const { data: rulesData } = realWorkspaceSettingsService.useInboxRules()

  const move = (direction: -1 | 1) => {
    const rules = [...(rulesData?.rules ?? [])].sort((a, b) => a.priority - b.priority)
    const target = index + direction
    if (target < 0 || target >= rules.length) return
    const next = [...rules]
    const a = next[index]
    const b = next[target]
    if (!a || !b) return
    next[index] = b
    next[target] = a
    reorder.mutate(next.map((r) => r.id))
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="flex min-w-0 items-start gap-2">
        <div className="flex shrink-0 flex-col">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={index === 0}
            onClick={() => move(-1)}
            aria-label="Move up"
          >
            <ArrowUp />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={index === total - 1}
            onClick={() => move(1)}
            aria-label="Move down"
          >
            <ArrowDown />
          </Button>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{rule.name}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">{inboxRuleSummary(rule, groups, members)}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Switch
          checked={rule.enabled}
          onCheckedChange={(checked) => update.mutate({ id: rule.id, patch: { enabled: checked } })}
        />
        <Button variant="ghost" size="sm" className="text-xs" onClick={onEdit}>
          Edit
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => remove.mutate(rule.id)}
          aria-label={`Delete ${rule.name}`}
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  )
}

export function InboxBehaviorPanel() {
  const { data: behavior, isLoading } = realWorkspaceSettingsService.useInboxBehavior()
  const updateBehavior = realWorkspaceSettingsService.useUpdateInboxBehavior()
  const { data: rulesData } = realWorkspaceSettingsService.useInboxRules()
  const { data: groupsData } = realWorkspaceSettingsService.useInboxGroups()
  const { data: membersData } = realWorkspaceMembersService.useList()
  const createRule = realWorkspaceSettingsService.useCreateInboxRule()
  const updateRule = realWorkspaceSettingsService.useUpdateInboxRule()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<InboxRule | null>(null)

  if (isLoading || !behavior) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-12 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading inbox behavior…
      </div>
    )
  }

  const rules = [...(rulesData?.rules ?? [])].sort((a, b) => a.priority - b.priority)
  const groups = groupsData?.groups ?? []
  const members = membersData ?? []
  const tz = behavior.timezone ?? behavior.effectiveTimezone ?? ''

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => updateBehavior.mutate({ mode: m.id })}
            className={`rounded-xl border p-4 text-left transition-colors ${
              behavior.mode === m.id ? 'border-primary bg-primary/5' : 'hover:border-primary/30'
            }`}
          >
            <m.icon
              className={`size-5 ${behavior.mode === m.id ? 'text-primary' : 'text-muted-foreground'}`}
            />
            <p className="mt-2 text-sm font-semibold">{m.label}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">{m.description}</p>
          </button>
        ))}
      </div>

      {behavior.mode === 'advanced' ? (
        <>
          <Card>
            <CardContent className="space-y-1.5 pt-6">
              <Label>Workspace timezone</Label>
              <Select
                value={tz || 'Asia/Kolkata'}
                onValueChange={(value) => updateBehavior.mutate({ timezone: value })}
              >
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {listTimezoneOptions().map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Used when a rule’s business hours omit a timezone.
              </p>
            </CardContent>
          </Card>

          <GroupsCard />
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle>Assignment rules</CardTitle>
                  <p className="text-muted-foreground text-xs">
                    First match wins — falls back to basic round-robin.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditing(null)
                    setFormOpen(true)
                  }}
                >
                  <Plus />
                  Add rule
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {rules.map((rule, index) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  index={index}
                  total={rules.length}
                  groups={groups}
                  members={members}
                  onEdit={() => {
                    setEditing(rule)
                    setFormOpen(true)
                  }}
                />
              ))}
              {rules.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  No rules yet — unmatched conversations fall back to Basic round robin.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <InboxRuleFormSheet
            open={formOpen}
            onOpenChange={setFormOpen}
            rule={editing}
            groups={groups}
            members={members}
            fallbackTimezone={tz}
            pending={createRule.isPending || updateRule.isPending}
            onSave={(input, onDone) => {
              if ('error' in input) {
                onDone(false)
                return
              }
              if (editing) {
                updateRule.mutate({ id: editing.id, patch: input }, { onSuccess: () => onDone(true) })
              } else {
                createRule.mutate(input, { onSuccess: () => onDone(true) })
              }
            }}
          />
        </>
      ) : null}
    </div>
  )
}
