import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  DEFAULT_AGENT_PERMISSIONS,
  WORKSPACE_PERMISSION_DEFS,
  type WorkspacePermission,
} from '@/lib/workspacePermissions'

export function MemberPermissionsEditor({
  value,
  onChange,
  disabled,
}: {
  value: WorkspacePermission[]
  onChange: (next: WorkspacePermission[]) => void
  disabled?: boolean
}) {
  const selected = new Set(value)

  const toggle = (key: WorkspacePermission) => {
    if (disabled) return
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange([...next])
  }

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Permissions</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onChange([...DEFAULT_AGENT_PERMISSIONS])}
        >
          Reset defaults
        </Button>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {WORKSPACE_PERMISSION_DEFS.map((perm) => (
          <li key={perm.key}>
            <Label className="flex cursor-pointer items-start gap-2 font-normal">
              <Checkbox
                checked={selected.has(perm.key)}
                disabled={disabled}
                onCheckedChange={() => toggle(perm.key)}
              />
              <span className="text-xs">{perm.label}</span>
            </Label>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function formatPermissionSummary(permissions: string[], role: string) {
  if (role === 'admin') return 'All permissions'
  const list = permissions.length > 0 ? permissions : DEFAULT_AGENT_PERMISSIONS
  if (list.length <= 2) {
    return list
      .map((key) => WORKSPACE_PERMISSION_DEFS.find((p) => p.key === key)?.label ?? key)
      .join(', ')
  }
  return `${list.length} areas`
}
