/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Building2, Check, Plus, X } from 'lucide-react';
import { api } from '../lib/api';
import { applyAuthSession } from '../lib/session';
import { connectSocket } from '../lib/socket';

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  role: string;
  waPhoneNumber?: string | null;
};

interface WorkspaceSwitcherDialogProps {
  open: boolean;
  onClose: () => void;
  activeWorkspaceId: string | null;
  onActiveChange: (workspace: WorkspaceSummary) => void;
}

export const WorkspaceSwitcherDialog: React.FC<WorkspaceSwitcherDialogProps> = ({
  open,
  onClose,
  activeWorkspaceId,
  onActiveChange,
}) => {
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setLoading(true);
    api
      .getWorkspaces()
      .then((res) => setWorkspaces(res.workspaces ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load companies'))
      .finally(() => setLoading(false));
  }, [open]);

  const applySwitch = async (workspaceId: string) => {
    setSwitchingId(workspaceId);
    setError(null);
    try {
      const res = await api.switchWorkspace(workspaceId);
      applyAuthSession(res);
      const active =
        res.workspaces?.find((w: WorkspaceSummary) => w.id === res.activeWorkspaceId) ??
        res.workspace;
      if (active) {
        onActiveChange(active);
        connectSocket(active.id);
      }
      onClose();
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not switch company');
    } finally {
      setSwitchingId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await api.createWorkspace(newName.trim());
      applyAuthSession(res);
      onClose();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create company');
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-switcher-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2 id="workspace-switcher-title" className="text-sm font-bold text-gray-900">
              Select company
            </h2>
            <p className="text-meta text-gray-400 mt-0.5">
              Each company has its own workspace, contacts, and WhatsApp accounts.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[320px] overflow-y-auto p-2">
          {loading && (
            <p className="text-xs text-gray-400 text-center py-8">Loading companies…</p>
          )}
          {!loading && workspaces.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">No companies found.</p>
          )}
          {!loading &&
            workspaces.map((ws) => {
              const isActive = ws.id === activeWorkspaceId;
              const initial = ws.name.charAt(0).toUpperCase();
              return (
                <button
                  key={ws.id}
                  type="button"
                  disabled={!!switchingId}
                  onClick={() => !isActive && applySwitch(ws.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all mb-1 ${
                    isActive
                      ? 'bg-sky-50 border border-[#c4c0ff]'
                      : 'hover:bg-slate-50 border border-transparent'
                  } ${switchingId === ws.id ? 'opacity-60' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#c4c0ff] flex items-center justify-center font-bold text-primary text-sm shrink-0">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{ws.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{ws.role}</p>
                    {ws.waPhoneNumber && (
                      <p className="text-xs text-primary font-medium mt-0.5 truncate">
                        {ws.waPhoneNumber}
                      </p>
                    )}
                  </div>
                  {isActive ? (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  ) : switchingId === ws.id ? (
                    <span className="text-xs text-gray-400">Switching…</span>
                  ) : (
                    <Building2 className="w-4 h-4 text-gray-300 shrink-0" />
                  )}
                </button>
              );
            })}
        </div>

        {error && (
          <p className="px-5 pb-2 text-meta text-danger-red font-medium">{error}</p>
        )}

        <div className="border-t border-slate-200 p-3 bg-slate-50">
          {!showCreate ? (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-primary hover:bg-sky-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add new company
            </button>
          ) : (
            <form onSubmit={handleCreate} className="space-y-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Company name"
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    setNewName('');
                  }}
                  className="flex-1 py-2 text-sm font-bold text-gray-500 rounded-xl hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="flex-1 py-2 text-sm font-bold text-white rounded-full bg-channel-green disabled:opacity-50"
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
