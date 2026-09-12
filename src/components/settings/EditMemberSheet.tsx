import { useState } from 'react'
import { Loader2, Pencil } from 'lucide-react'

import { InboxScopeEditor } from '@/components/settings/InboxScopeEditor'
import { MemberPermissionsEditor } from '@/components/settings/MemberPermissionsEditor'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DEFAULT_AGENT_PERMISSIONS,
  type WorkspacePermission,
} from '@/lib/workspacePermissions'
import { resolveEffectiveInboxScope, type InboxScope } from '@/lib/inboxScope'
import type { WorkspaceMember } from '@/services/realWorkspaceMembers.service'

export function EditMemberSheet({
  member,
  pending,
  onSave,
}: {
  member: WorkspaceMember
  pending?: boolean
  onSave: (
    patch: { permissions: WorkspacePermission[]; inboxScope: InboxScope },
    onDone: (ok: boolean, error?: string) => void
  ) => void
}) {
  const [open, setOpen] = useState(false)
  const [permissions, setPermissions] = useState<WorkspacePermission[]>(
    (member.permissions.length ? member.permissions : DEFAULT_AGENT_PERMISSIONS) as WorkspacePermission[]
  )
  const [inboxScope, setInboxScope] = useState<InboxScope>(() =>
    resolveEffectiveInboxScope(member.role, member.inboxScope)
  )
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setPermissions(
      (member.permissions.length ? member.permissions : DEFAULT_AGENT_PERMISSIONS) as WorkspacePermission[]
    )
    setInboxScope(resolveEffectiveInboxScope(member.role, member.inboxScope))
    setError(null)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) reset()
      }}
    >
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto px-1.5 text-xs">
          <Pencil className="size-3" />
          Edit
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Edit permissions</SheetTitle>
          <p className="text-muted-foreground text-xs">{member.name}</p>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <MemberPermissionsEditor value={permissions} onChange={setPermissions} />
          {permissions.includes('inbox') ? (
            <InboxScopeEditor value={inboxScope} onChange={setInboxScope} />
          ) : null}
          {error ? <p className="text-destructive text-xs">{error}</p> : null}
        </div>
        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button variant="ghost">Cancel</Button>
          </SheetClose>
          <Button
            disabled={pending}
            onClick={() => {
              setError(null)
              onSave({ permissions, inboxScope }, (ok, err) => {
                if (ok) setOpen(false)
                else setError(err ?? 'Could not update permissions.')
              })
            }}
          >
            {pending ? <Loader2 className="animate-spin" /> : null}
            Save permissions
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
