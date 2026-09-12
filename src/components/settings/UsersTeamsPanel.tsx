import { useState } from 'react'
import { Loader2, Search, Trash2 } from 'lucide-react'

import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { EditMemberSheet } from '@/components/settings/EditMemberSheet'
import { InviteUserSheet } from '@/components/settings/InviteUserSheet'
import { formatPermissionSummary } from '@/components/settings/MemberPermissionsEditor'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatInboxScopeSummary, resolveEffectiveInboxScope } from '@/lib/inboxScope'
import { ApiError } from '@/lib/httpClient'
import { asPermissionList, hasWorkspacePermission } from '@/lib/workspacePermissions'
import { profileResource } from '@/services/profile.service'
import {
  MAX_TEAM_MEMBERS,
  realWorkspaceMembersService,
  type AddMemberInput,
  type MemberRole,
} from '@/services/realWorkspaceMembers.service'

function reportError(err: unknown, fallback: string) {
  window.alert(err instanceof ApiError ? err.message : fallback)
}

export function UsersTeamsPanel() {
  const { data: me } = profileResource.useGet()
  const { data: members = [], isLoading } = realWorkspaceMembersService.useList()
  const addMemberMutation = realWorkspaceMembersService.useAdd()
  const updateMember = realWorkspaceMembersService.useUpdate()
  const removeMemberMutation = realWorkspaceMembersService.useRemove()
  const confirm = useConfirm()

  const [query, setQuery] = useState('')
  const canManage = hasWorkspacePermission(asPermissionList(me?.permissions), 'users', me?.role)

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.email.toLowerCase().includes(query.toLowerCase())
  )

  const seatsUsed = members.length
  const seatsFull = seatsUsed >= MAX_TEAM_MEMBERS

  const removeMember = async (id: string, name: string) => {
    const ok = await confirm({
      title: `Remove ${name}?`,
      description: 'They will lose access to this workspace immediately.',
      confirmLabel: 'Remove',
      destructive: true,
    })
    if (ok)
      removeMemberMutation.mutate(id, { onError: (err) => reportError(err, 'Could not remove this member.') })
  }

  const updateRole = (id: string, role: MemberRole) =>
    updateMember.mutate(
      { id, patch: { role } },
      { onError: (err) => reportError(err, 'Could not change this role.') }
    )

  const patchAssign = (
    id: string,
    role: MemberRole,
    patch: { autoAssignEligible?: boolean; assignmentLimit?: number | null }
  ) => updateMember.mutate({ id, patch: { role, ...patch } })

  const inviteMember = (input: AddMemberInput, onDone: (ok: boolean, error?: string) => void) => {
    addMemberMutation.mutate(input, {
      onSuccess: () => onDone(true),
      onError: (err) => onDone(false, err instanceof ApiError ? err.message : 'Could not add this user.'),
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Team members</CardTitle>
            <p className="text-muted-foreground mt-1 text-xs">
              {seatsUsed} of {MAX_TEAM_MEMBERS} seats used
            </p>
          </div>
          {canManage ? (
            <InviteUserSheet
              disabled={seatsFull}
              pending={addMemberMutation.isPending}
              onInvite={inviteMember}
            />
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative max-w-xs">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members…"
            className="pl-8"
          />
        </div>

        {isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Loading team members…
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Access</TableHead>
                <TableHead>Auto-assign</TableHead>
                <TableHead>Status</TableHead>
                {canManage ? <TableHead className="text-right">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        {member.avatar ? <AvatarImage src={member.avatar} alt="" /> : null}
                        <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{member.name}</p>
                        <p className="text-muted-foreground truncate text-xs">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {member.isOwner ? (
                      <Badge>Owner</Badge>
                    ) : canManage ? (
                      <Select
                        value={member.role}
                        onValueChange={(v) => updateRole(member.id, v as MemberRole)}
                      >
                        <SelectTrigger size="sm" className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="agent">Agent</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm capitalize">{member.role}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground text-xs">
                          {formatPermissionSummary(member.permissions, member.role)}
                        </span>
                        {canManage && member.role === 'agent' && !member.isOwner ? (
                          <EditMemberSheet
                            member={member}
                            pending={updateMember.isPending}
                            onSave={(patch, onDone) => {
                              const hasInbox = patch.permissions.includes('inbox')
                              updateMember.mutate(
                                {
                                  id: member.id,
                                  patch: {
                                    role: 'agent',
                                    permissions: patch.permissions,
                                    inboxScope:
                                      hasInbox && patch.inboxScope.mode === 'restricted'
                                        ? patch.inboxScope
                                        : { mode: 'all' },
                                  },
                                },
                                {
                                  onSuccess: () => onDone(true),
                                  onError: (err) =>
                                    onDone(
                                      false,
                                      err instanceof ApiError ? err.message : 'Could not update permissions.'
                                    ),
                                }
                              )
                            }}
                          />
                        ) : null}
                      </div>
                      {member.role === 'agent' && member.permissions.includes('inbox') ? (
                        <p className="text-muted-foreground text-[11px]">
                          Inbox:{' '}
                          {formatInboxScopeSummary(resolveEffectiveInboxScope(member.role, member.inboxScope))}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={member.autoAssignEligible}
                        disabled={!canManage}
                        onCheckedChange={() =>
                          patchAssign(member.id, member.role, {
                            autoAssignEligible: !member.autoAssignEligible,
                          })
                        }
                      />
                      <Input
                        type="number"
                        min={0}
                        placeholder="∞"
                        title="Max open conversations via auto-assign (blank = unlimited)"
                        className="h-8 w-14 px-1.5 text-center"
                        key={`${member.id}-${member.assignmentLimit ?? 'unlimited'}`}
                        defaultValue={member.assignmentLimit ?? ''}
                        disabled={!canManage}
                        onBlur={(e) => {
                          const raw = e.target.value
                          const value = raw === '' ? null : Math.max(0, Number(raw))
                          if (value === member.assignmentLimit) return
                          if (raw !== '' && Number.isNaN(value)) return
                          patchAssign(member.id, member.role, { assignmentLimit: value })
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {member.status}
                    </Badge>
                  </TableCell>
                  {canManage ? (
                    <TableCell className="text-right">
                      {!member.isOwner && member.userId !== me?.id ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => void removeMember(member.id, member.name)}
                          aria-label={`Remove ${member.name}`}
                        >
                          <Trash2 />
                        </Button>
                      ) : null}
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!canManage ? (
          <p className="text-muted-foreground text-xs">
            You can view the team. Ask an admin for the Users & teams permission to invite or change access.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
