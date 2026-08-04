import type { Edge, Node } from '@xyflow/react';

/** Steps that render as outbound chat content in the preview strip. */
export const PREVIEW_VISIBLE_TYPES = new Set(['SEND_MESSAGE', 'ASK_QUESTION', 'BUTTONS']);

export type FlowPreviewStep = {
  id: string;
  type: 'SEND_MESSAGE' | 'ASK_QUESTION' | 'BUTTONS';
  text: string;
  quickReplies: { title: string }[];
  /** WA template name when messageMode is template */
  templateName?: string;
};

/**
 * Walk linear "Next Step" path from TRIGGER (yes-branch on CONDITION).
 * Returns only message-producing steps, in order.
 */
export function walkVisiblePreviewSteps(
  nodes: Node[],
  edges: Edge[]
): FlowPreviewStep[] {
  if (nodes.length === 0) return [];

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const outs = new Map<string, Edge[]>();
  for (const e of edges) {
    if (!byId.has(e.source) || !byId.has(e.target)) continue;
    const list = outs.get(e.source) ?? [];
    list.push(e);
    outs.set(e.source, list);
  }

  const trigger = nodes.find((n) => n.type === 'TRIGGER');
  let current: string | undefined = trigger?.id;
  if (!current) {
    const targets = new Set(edges.map((e) => e.target));
    current = nodes.find((n) => !targets.has(n.id))?.id ?? nodes[0]?.id;
  }

  const seen = new Set<string>();
  const steps: FlowPreviewStep[] = [];

  while (current && !seen.has(current)) {
    seen.add(current);
    const node = byId.get(current);
    if (!node) break;

    if (node.type && PREVIEW_VISIBLE_TYPES.has(node.type)) {
      const d = (node.data ?? {}) as Record<string, unknown>;
      const text =
        typeof d.text === 'string'
          ? d.text
          : typeof d.templateName === 'string'
            ? ''
            : '';
      const fromButtons = Array.isArray(d.buttons)
        ? (d.buttons as { title?: string }[])
            .map((r) => ({ title: String(r?.title ?? '').trim() }))
            .filter((r) => r.title)
        : [];
      const fromQuickReplies = Array.isArray(d.quickReplies)
        ? (d.quickReplies as { title?: string }[])
            .map((r) => ({ title: String(r?.title ?? '').trim() }))
            .filter((r) => r.title)
        : [];
      const quickReplies = node.type === 'BUTTONS' ? fromButtons : fromQuickReplies;
      const templateName =
        typeof d.templateName === 'string' && d.templateName.trim()
          ? d.templateName.trim()
          : undefined;
      steps.push({
        id: node.id,
        type: node.type as 'SEND_MESSAGE' | 'ASK_QUESTION' | 'BUTTONS',
        text: text.trim(),
        quickReplies,
        templateName,
      });
    }

    if (node.type === 'END') break;

    const next = pickNextEdge(outs.get(current) ?? [], node.type);
    current = next?.target;
  }

  return steps;
}

/** Prefer default/linear handle; on CONDITION follow yes then default then no. */
function pickNextEdge(list: Edge[], nodeType: string | undefined): Edge | undefined {
  if (list.length === 0) return undefined;
  if (nodeType === 'CONDITION') {
    return (
      list.find((e) => e.sourceHandle === 'yes') ??
      list.find((e) => !e.sourceHandle || e.sourceHandle === 'default') ??
      list.find((e) => e.sourceHandle === 'no') ??
      list[0]
    );
  }
  return (
    list.find((e) => !e.sourceHandle || e.sourceHandle === 'default') ??
    list.find((e) => e.sourceHandle !== 'yes' && e.sourceHandle !== 'no') ??
    list[0]
  );
}
