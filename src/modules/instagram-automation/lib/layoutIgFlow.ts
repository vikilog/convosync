import type { Edge, Node } from '@xyflow/react';

const COL_W = 300;
const ROW_H = 200;
const ORIGIN_X = 60;
const ORIGIN_Y = 60;

/** ponytail: skip layered layout above this — fitView only; upgrade: worker + elk */
export const IG_LAYOUT_NODE_CEILING = 200;

/**
 * Left-to-right layered layout from TRIGGER (or roots).
 * Yes branch before No. No new deps — plain BFS ranks.
 */
export function layoutIgFlow(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes;

  const ids = new Set(nodes.map((n) => n.id));
  const outs = new Map<string, Edge[]>();
  const indeg = new Map<string, number>();
  for (const id of ids) {
    outs.set(id, []);
    indeg.set(id, 0);
  }
  for (const e of edges) {
    if (!ids.has(e.source) || !ids.has(e.target)) continue;
    outs.get(e.source)!.push(e);
    indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1);
  }
  for (const list of outs.values()) {
    list.sort((a, b) => handleOrder(a.sourceHandle) - handleOrder(b.sourceHandle));
  }

  const roots = nodes
    .filter((n) => (indeg.get(n.id) ?? 0) === 0)
    .sort((a, b) => {
      if (a.type === 'TRIGGER') return -1;
      if (b.type === 'TRIGGER') return 1;
      return 0;
    })
    .map((n) => n.id);

  const start = roots.length > 0 ? roots : [nodes[0].id];

  const rank = new Map<string, number>();
  for (const id of start) rank.set(id, 0);

  // Bounded longest-path ranks — cycles can't blow up the queue (old BFS looped forever).
  for (let round = 0; round < ids.size; round++) {
    let changed = false;
    for (const id of ids) {
      const r = rank.get(id);
      if (r === undefined) continue;
      for (const e of outs.get(id) ?? []) {
        const next = r + 1;
        const prev = rank.get(e.target);
        if (prev === undefined || next > prev) {
          rank.set(e.target, next);
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  for (const id of ids) {
    if (!rank.has(id)) rank.set(id, 0);
  }

  // Visit order within a rank: follow edge order from parents (yes before no).
  const order: string[] = [];
  const seen = new Set<string>();
  const walk = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    order.push(id);
    for (const e of outs.get(id) ?? []) walk(e.target);
  };
  for (const id of start) walk(id);
  for (const id of ids) walk(id);

  const layers = new Map<number, string[]>();
  for (const id of order) {
    const r = rank.get(id) ?? 0;
    if (!layers.has(r)) layers.set(r, []);
    layers.get(r)!.push(id);
  }

  const pos = new Map<string, { x: number; y: number }>();
  const ranks = [...layers.keys()].sort((a, b) => a - b);
  for (const r of ranks) {
    const layer = layers.get(r)!;
    layer.forEach((id, i) => {
      pos.set(id, { x: ORIGIN_X + r * COL_W, y: ORIGIN_Y + i * ROW_H });
    });
  }

  return nodes.map((n) => {
    const p = pos.get(n.id);
    return p ? { ...n, position: p } : n;
  });
}

function handleOrder(h?: string | null) {
  if (h === 'yes') return 0;
  if (h === 'no') return 2;
  return 1;
}
