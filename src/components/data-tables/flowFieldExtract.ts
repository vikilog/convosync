export type FlowFieldOption = { name: string; label: string };

/** Walks a Meta Flow JSON's screens for form components (name + label), for the field-mapping picker. */
export function extractFlowFields(flowJson: unknown): FlowFieldOption[] {
  const screens = (flowJson as { screens?: unknown[] } | null)?.screens;
  if (!Array.isArray(screens)) return [];
  const seen = new Map<string, FlowFieldOption>();
  for (const screen of screens) {
    const children = (screen as { layout?: { children?: unknown[] } })?.layout?.children;
    if (!Array.isArray(children)) continue;
    for (const child of children) {
      const name = (child as { name?: unknown })?.name;
      if (typeof name !== 'string' || !name) continue;
      const label = (child as { label?: unknown })?.label;
      seen.set(name, { name, label: typeof label === 'string' && label ? label : name });
    }
  }
  return [...seen.values()];
}
