import { useState } from 'react'
import { Loader2, UserPlus } from 'lucide-react'

import { InboxScopeEditor } from '@/components/settings/InboxScopeEditor'
import { MemberPermissionsEditor } from '@/components/settings/MemberPermissionsEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { FULL_INBOX_SCOPE, type InboxScope } from '@/lib/inboxScope'
import { DEFAULT_AGENT_PERMISSIONS, type WorkspacePermission } from '@/lib/workspacePermissions'
import type { AddMemberInput, MemberRole } from '@/services/realWorkspaceMembers.service'

export function InviteUserSheet({
  disabled,
  pending,
  onInvite,
}: {
  disabled?: boolean
  pending?: boolean
  onInvite: (input: AddMemberInput, onDone: (ok: boolean, error?: string) => void) => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<MemberRole>('agent')
  const [permissions, setPermissions] = useState<WorkspacePermission[]>([...DEFAULT_AGENT_PERMISSIONS])
  const [inboxScope, setInboxScope] = useState<InboxScope>(FULL_INBOX_SCOPE)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setName('')
    setEmail('')
    setPassword('')
    setRole('agent')
    setPermissions([...DEFAULT_AGENT_PERMISSIONS])
    setInboxScope(FULL_INBOX_SCOPE)
    setError(null)
  }

  const canSave = name.trim().length > 0 && email.trim().length > 0 && password.trim().length >= 8

  const submit = () => {
    setError(null)
    onInvite(
      {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        role,
        permissions: role === 'agent' ? permissions : undefined,
        inboxScope:
          role === 'agent' && permissions.includes('inbox') && inboxScope.mode === 'restricted'
            ? inboxScope
            : undefined,
      },
      (ok, err) => {
        if (ok) {
          setOpen(false)
          reset()
        } else {
          setError(err ?? 'Could not add this user.')
        }
      }
    )
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <SheetTrigger asChild>
        <Button size="sm" disabled={disabled}>
          <UserPlus />
          Invite user
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Invite user</SheetTitle>
          <p className="text-muted-foreground text-xs">
            New teammates get an email with these login details.
          </p>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-name">Name</Label>
            <Input
              id="invite-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Team member name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-password">Temporary password</Label>
            <Input
              id="invite-password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
            />
            <p className="text-muted-foreground text-xs">
              Shared with them by email — they can change it after login.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as MemberRole)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin — full access</SelectItem>
                <SelectItem value="agent">Agent — custom permissions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {role === 'agent' ? (
            <>
              <MemberPermissionsEditor value={permissions} onChange={setPermissions} />
              {permissions.includes('inbox') ? (
                <InboxScopeEditor value={inboxScope} onChange={setInboxScope} />
              ) : null}
            </>
          ) : null}

          {error ? <p className="text-destructive text-xs">{error}</p> : null}
        </div>

        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button variant="ghost">Cancel</Button>
          </SheetClose>
          <Button disabled={!canSave || pending} onClick={submit}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Send invite
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
