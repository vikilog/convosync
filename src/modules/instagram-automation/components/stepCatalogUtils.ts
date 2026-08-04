import {
  IG_STEP_CATALOG,
  TRIGGER_PALETTE_ITEM,
  type StepCatalogItem,
} from '../stepCatalog';
import type { IgJourneyNodeType } from '../types';

export const PALETTE_ITEMS: StepCatalogItem[] = [TRIGGER_PALETTE_ITEM, ...IG_STEP_CATALOG];

export function filterPaletteItems(
  items: StepCatalogItem[],
  options: { query?: string; hasTrigger?: boolean } = {}
): StepCatalogItem[] {
  const q = options.query?.trim().toLowerCase() ?? '';
  const hasTrigger = options.hasTrigger ?? false;

  return items.filter((item) => {
    if (item.type === 'TRIGGER' && hasTrigger) return false;
    if (!q) return true;
    return (
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q)
    );
  });
}

export function groupPaletteItems(items: StepCatalogItem[]) {
  const map = new Map<StepCatalogItem['category'], StepCatalogItem[]>();
  for (const item of items) {
    const list = map.get(item.category) ?? [];
    list.push(item);
    map.set(item.category, list);
  }
  return map;
}

export type StepCatalogSelectHandler = (type: IgJourneyNodeType) => void;
