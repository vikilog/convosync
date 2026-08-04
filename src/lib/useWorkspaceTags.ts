import { useEffect, useState } from 'react';
import { api } from './api';

/**
 * Workspace tag names for pickers/suggestions (contact forms, journey UPDATE_TAG,
 * flow-builder tag condition). Backed by the WorkspaceTag registry, folder-clustered order.
 */
export function useWorkspaceTags(): string[] {
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    api
      .getContactTags()
      .then((res) => {
        if (!cancelled) setTags(res.tags ?? []);
      })
      .catch(() => {
        if (!cancelled) setTags([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return tags;
}
