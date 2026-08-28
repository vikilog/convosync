/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, Pencil, Plus, Tag as TagIcon, Trash2 } from 'lucide-react';
import { api, type WorkspaceTagRecord } from '../../lib/api';
import { groupTagsByFolder } from '../../lib/tagFolders';
import { CreateTagModal } from './CreateTagModal';

export function TagsPanel() {
  const [tags, setTags] = useState<WorkspaceTagRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<WorkspaceTagRecord | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getWorkspaceTags();
      setTags(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingTag(null);
    setModalOpen(true);
  };

  const toggleFolder = (folder: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  };

  const handleDelete = async (tag: WorkspaceTagRecord) => {
    if (
      !window.confirm(
        `Remove "${tag.name}" from the tag registry? Contacts that already have this tag keep it — this only removes it from pickers.`
      )
    ) {
      return;
    }
    setDeletingId(tag.id);
    setError(null);
    try {
      await api.deleteWorkspaceTag(tag.id);
      setTags((prev) => prev.filter((t) => t.id !== tag.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete tag');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading…
      </div>
    );
  }

  const groups = groupTagsByFolder<WorkspaceTagRecord>(tags);
  const folderNames: string[] = [];
  for (const tag of tags) {
    if (tag.folder && !folderNames.includes(tag.folder)) folderNames.push(tag.folder);
  }
  const folders = folderNames.sort((a, b) => a.localeCompare(b));

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-1">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-dark-navy">Tags</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage the tags contacts can be labeled with — used across Contacts, Journeys, and
            AgentFlow.
          </p>
        </div>
        {tags.length > 0 ? (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4" />
            New Tag
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {tags.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-[0.5px] border-dashed border-border-subtle bg-white py-12 text-center">
          <TagIcon className="h-8 w-8 text-slate-300" aria-hidden />
          <p className="text-sm font-bold text-dark-navy">No Tags</p>
          <p className="text-xs text-slate-500">Create your first Tag!</p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4" />
            New Tag
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const isCollapsed = collapsedFolders.has(group.folder);
            return (
              <section
                key={group.folder}
                className="overflow-hidden rounded-xl border-[0.5px] border-border-subtle bg-white"
              >
                <button
                  type="button"
                  onClick={() => toggleFolder(group.folder)}
                  className="flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-surface-muted/60"
                >
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-dark-navy">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden />
                    )}
                    {group.folder}
                    <span className="font-normal text-slate-400">({group.items.length})</span>
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="divide-y divide-swiss-line border-t border-swiss-line">
                    {group.items.map((tag) => (
                      <div key={tag.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          {tag.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTag(tag);
                              setModalOpen(true);
                            }}
                            className="cursor-pointer rounded-md p-1.5 text-slate-400 hover:bg-surface-muted hover:text-slate-700"
                            aria-label={`Edit ${tag.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(tag)}
                            disabled={deletingId === tag.id}
                            className="cursor-pointer rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                            aria-label={`Delete ${tag.name}`}
                          >
                            {deletingId === tag.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <CreateTagModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editingTag={editingTag}
        folders={folders}
        onSaved={(tag) => {
          setTags((prev) => {
            const exists = prev.some((t) => t.id === tag.id);
            return exists ? prev.map((t) => (t.id === tag.id ? tag : t)) : [...prev, tag];
          });
        }}
      />
    </div>
  );
}
