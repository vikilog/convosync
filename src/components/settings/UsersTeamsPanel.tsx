import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Pencil, Search, UserPlus, X } from 'lucide-react';
import { api, getUserId, getUserPermissions, getUserRole } from '../../lib/api';
import {
  DEFAULT_AGENT_PERMISSIONS,
  hasWorkspacePermission,
  type WorkspacePermission,
} from '../../lib/workspacePermissions';
import {
  formatPermissionSummary,
  MemberPermissionsEditor,
} from './MemberPermissionsEditor';
import { InboxScopeEditor } from './InboxScopeEditor';
import {
  formatInboxScopeSummary,
  FULL_INBOX_SCOPE,
  resolveEffectiveInboxScope,
  type InboxScope,
} from '../../lib/inboxScope';

type Member = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  inboxScope?: InboxScope;
  status: string;
  isOwner: boolean;
};

type InviteForm = {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'agent';
  permissions: WorkspacePermission[];
  inboxScope: InboxScope;
};

const emptyInvite: InviteForm = {
  name: '',
  email: '',
  password: '',
  role: 'agent',
  permissions: [...DEFAULT_AGENT_PERMISSIONS],
  inboxScope: FULL_INBOX_SCOPE,
};

export function UsersTeamsPanel() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [canManageUsers, setCanManageUsers] = useState(
    getUserRole() === 'admin' || hasWorkspacePermission(getUserPermissions(), 'users', getUserRole())
  );
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState<InviteForm>(emptyInvite);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editPermissions, setEditPermissions] = useState<WorkspacePermission[]>([]);
  const [editInboxScope, setEditInboxScope] = useState<InboxScope>(FULL_INBOX_SCOPE);
  const [saving, setSaving] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, me] = await Promise.all([
        api.getWorkspaceMembers() as Promise<Member[]>,
        api.getMe() as Promise<{ role?: string; permissions?: string[] }>,
      ]);
      setMembers(list);
      if (me?.role) {
        setCanManageUsers(hasWorkspacePermission(me.permissions, 'users', me.role));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load team members');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const hasInbox =
        invite.role === 'agent' && invite.permissions.includes('inbox');
      const result = (await api.addWorkspaceMember({
        email: invite.email.trim(),
        name: invite.name.trim() || undefined,
        password: invite.password.trim() || undefined,
        role: invite.role,
        permissions: invite.role === 'agent' ? invite.permissions : undefined,
        inboxScope:
          hasInbox && invite.inboxScope.mode === 'restricted'
            ? invite.inboxScope
            : undefined,
      })) as { member: Member; createdUser?: boolean };

      setMembers((prev) => [...prev, result.member]);
      setMessage(
        result.createdUser
          ? `${result.member.name} was added with a new account. Share the password you set with them.`
          : `${result.member.name} was added to this company.`
      );
      setInvite(emptyInvite);
      setShowInvite(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add user');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (member: Member, role: 'admin' | 'agent') => {
    if (member.role === role) return;
    setActionKey(`${member.id}:role`);
    setError(null);
    setMessage(null);
    try {
      const updated = (await api.updateWorkspaceMember(member.id, {
        role,
        permissions: role === 'agent' ? member.permissions : undefined,
      })) as Member;
      setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, ...updated } : m)));
      setMessage(`${updated.name}'s role updated to ${role}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setActionKey(null);
    }
  };

  const handleSavePermissions = async () => {
    if (!editingMember || editingMember.role === 'admin') return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const hasInbox = editPermissions.includes('inbox');
      const updated = (await api.updateWorkspaceMember(editingMember.id, {
        role: editingMember.role as 'admin' | 'agent',
        permissions: editPermissions,
        inboxScope:
          hasInbox && editInboxScope.mode === 'restricted' ? editInboxScope : { mode: 'all' },
      })) as Member;
      setMembers((prev) => prev.map((m) => (m.id === editingMember.id ? { ...m, ...updated } : m)));
      setMessage(`${updated.name}'s permissions were updated.`);
      setEditingMember(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (member: Member) => {
    if (member.isOwner) return;
    const confirmed = window.confirm(`Remove ${member.name} from this company?`);
    if (!confirmed) return;

    setActionKey(`${member.id}:remove`);
    setError(null);
    setMessage(null);
    try {
      await api.removeWorkspaceMember(member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      setMessage(`${member.name} was removed from this company.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setActionKey(null);
    }
  };

  return (
    <div className="space-y-4">
      {message && (
        <p className="text-sm font-bold text-accent-green bg-accent-green-bg border border-accent-green/15 rounded-xl px-4 py-2">
          {message}
        </p>
      )}
      {error && (
        <p className="text-sm font-bold text-danger-red bg-red-50 border border-red-100 rounded-xl px-4 py-2">
          {error}
        </p>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-gray-950">Team members</h3>
            <p className="text-meta text-gray-500 font-medium mt-0.5">
              {members.length} user{members.length === 1 ? '' : 's'} in this company
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {canManageUsers && (
              <button
                type="button"
                onClick={() => {
                  setShowInvite(true);
                  setError(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add user
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-gray-500 font-bold border-b border-slate-200">
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Access</th>
                  <th className="px-5 py-3">Status</th>
                  {canManageUsers && <th className="px-5 py-3 w-28">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const isSelf = m.userId === getUserId();
                  const busy = actionKey?.startsWith(m.id) ?? false;
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-slate-200 last:border-0 hover:bg-slate-50/50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#c4c0ff] flex items-center justify-center font-bold text-primary text-sm">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">
                              {m.name}
                              {isSelf && (
                                <span className="ml-1.5 text-xs text-gray-400 font-bold">(You)</span>
                              )}
                            </p>
                            <p className="text-gray-400 mt-0.5">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {canManageUsers && !m.isOwner ? (
                          <select
                            value={m.role}
                            disabled={busy}
                            onChange={(e) =>
                              void handleRoleChange(m, e.target.value as 'admin' | 'agent')
                            }
                            className="text-sm font-bold border border-slate-200 rounded-lg px-2 py-1.5 bg-white capitalize focus:outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="admin">Admin</option>
                            <option value="agent">Agent</option>
                          </select>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-gray-800 capitalize">
                            {m.role}
                            {m.isOwner && (
                              <span className="text-xs bg-sky-50 text-primary px-1.5 py-0.5 rounded font-bold">
                                Owner
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 font-medium">
                              {formatPermissionSummary(m.permissions, m.role)}
                            </span>
                            {canManageUsers && m.role === 'agent' && !m.isOwner && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMember(m);
                                  setEditPermissions(
                                    (m.permissions.length
                                      ? m.permissions
                                      : DEFAULT_AGENT_PERMISSIONS) as WorkspacePermission[]
                                  );
                                  setEditInboxScope(
                                    resolveEffectiveInboxScope(m.role, m.inboxScope)
                                  );
                                }}
                              className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
                            >
                              <Pencil className="w-3 h-3" />
                                Edit
                              </button>
                            )}
                          </div>
                          {m.role === 'agent' && m.permissions.includes('inbox') && (
                            <span className="text-xs text-gray-400 font-medium">
                              Inbox: {formatInboxScopeSummary(resolveEffectiveInboxScope(m.role, m.inboxScope))}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-accent-green font-bold capitalize">
                          <span className="w-2 h-2 rounded-full bg-accent-green" />
                          {m.status}
                        </span>
                      </td>
                      {canManageUsers && (
                        <td className="px-5 py-4">
                          {!m.isOwner && !isSelf ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handleRemove(m)}
                              className="text-sm font-bold text-danger-red hover:underline disabled:opacity-50"
                            >
                              {busy ? 'Removing…' : 'Remove'}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-300 font-bold">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={canManageUsers ? 5 : 4} className="px-5 py-12 text-center text-gray-400">
                      No users found for this company.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!canManageUsers && (
        <p className="text-meta text-gray-500 font-medium">
          You can view the team here. Only admins or users with the Users & teams permission can add
          members or change access.
        </p>
      )}

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div
            className="absolute inset-0"
            onClick={() => !saving && setShowInvite(false)}
            aria-hidden
          />
          <form
            onSubmit={(e) => void handleInvite(e)}
            className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-gray-950">Add team member</h3>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Assign a role and choose what this user can access in your workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInvite(false)}
                disabled={saving}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="block space-y-1">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Email</span>
              <input
                required
                type="email"
                value={invite.email}
                onChange={(e) => setInvite((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                Full name (new users only)
              </span>
              <input
                type="text"
                value={invite.name}
                onChange={(e) => setInvite((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Required if email is not registered yet"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                Temporary password (new users only)
              </span>
              <input
                type="password"
                value={invite.password}
                onChange={(e) => setInvite((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Min 8 characters"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Role</span>
              <select
                value={invite.role}
                onChange={(e) =>
                  setInvite((prev) => ({
                    ...prev,
                    role: e.target.value as 'admin' | 'agent',
                  }))
                }
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="agent">Agent — custom permissions</option>
                <option value="admin">Admin — full access</option>
              </select>
            </label>

            {invite.role === 'agent' && (
              <>
                <MemberPermissionsEditor
                  value={invite.permissions}
                  onChange={(permissions) => setInvite((prev) => ({ ...prev, permissions }))}
                />
                {invite.permissions.includes('inbox') && (
                  <InboxScopeEditor
                    value={invite.inboxScope}
                    onChange={(inboxScope) => setInvite((prev) => ({ ...prev, inboxScope }))}
                  />
                )}
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowInvite(false)}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Add user
              </button>
            </div>
          </form>
        </div>
      )}

      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div
            className="absolute inset-0"
            onClick={() => !saving && setEditingMember(null)}
            aria-hidden
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-gray-950">Edit permissions</h3>
                <p className="text-xs text-gray-500 font-medium mt-1">{editingMember.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                disabled={saving}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <MemberPermissionsEditor
              value={editPermissions}
              onChange={setEditPermissions}
            />

            {editPermissions.includes('inbox') && (
              <InboxScopeEditor value={editInboxScope} onChange={setEditInboxScope} />
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSavePermissions()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Save permissions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
