/** Group top-level IG comments by commenter (fromId → username). */

export type ClubbableComment = {
  id: string;
  fromId?: string | null;
  username?: string | null;
  leadId?: string | null;
  timestamp?: string | null;
  replies?: Array<{ leadId?: string | null }>;
};

export function commenterKey(c: {
  fromId?: string | null;
  username?: string | null;
  id: string;
}): string {
  if (c.fromId) return `id:${c.fromId}`;
  if (c.username?.trim()) return `u:${c.username.trim().toLowerCase()}`;
  return `solo:${c.id}`;
}

export function clubCommentsByUser<T extends ClubbableComment>(
  comments: T[]
): Array<{
  key: string;
  username: string | null;
  leadId: string | null;
  comments: T[];
}> {
  const order: string[] = [];
  const map = new Map<string, T[]>();
  for (const c of comments) {
    const key = commenterKey(c);
    if (!map.has(key)) {
      order.push(key);
      map.set(key, []);
    }
    map.get(key)!.push(c);
  }
  return order.map((key) => {
    const list = [...(map.get(key) || [])].sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return ta - tb;
    });
    const leadId =
      list.find((c) => c.leadId)?.leadId ??
      list.flatMap((c) => c.replies || []).find((r) => r.leadId)?.leadId ??
      null;
    return {
      key,
      username: list[0]?.username ?? null,
      leadId,
      comments: list,
    };
  });
}
