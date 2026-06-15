import {
  DEFAULT_AGENT_PERMISSIONS,
  WORKSPACE_PERMISSION_DEFS,
  type WorkspacePermission,
} from '../../lib/workspacePermissions';

type MemberPermissionsEditorProps = {
  value: WorkspacePermission[];
  onChange: (next: WorkspacePermission[]) => void;
  disabled?: boolean;
};

export function MemberPermissionsEditor({
  value,
  onChange,
  disabled,
}: MemberPermissionsEditorProps) {
  const selected = new Set(value);

  function toggle(key: WorkspacePermission) {
    if (disabled) return;
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange([...next]);
  }

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold uppercase tracking-wide text-gray-500">
          Permissions
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange([...DEFAULT_AGENT_PERMISSIONS])}
          className="text-sm font-bold text-primary hover:underline disabled:opacity-50"
        >
          Reset defaults
        </button>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {WORKSPACE_PERMISSION_DEFS.map((perm) => (
          <li key={perm.key}>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-transparent px-1 py-1 hover:border-slate-200 hover:bg-white">
              <input
                type="checkbox"
                className="mt-0.5 accent-sky-600"
                checked={selected.has(perm.key)}
                disabled={disabled}
                onChange={() => toggle(perm.key)}
              />
              <span className="text-xs font-medium text-gray-800">{perm.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function formatPermissionSummary(permissions: string[], role: string) {
  if (role === 'admin') return 'All permissions';
  const list = permissions.length > 0 ? permissions : DEFAULT_AGENT_PERMISSIONS;
  if (list.length <= 2) {
    return list
      .map((key) => WORKSPACE_PERMISSION_DEFS.find((p) => p.key === key)?.label ?? key)
      .join(', ');
  }
  return `${list.length} areas`;
}
