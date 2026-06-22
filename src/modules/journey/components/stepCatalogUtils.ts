import {
  JOURNEY_STEP_CATALOG,
  TRIGGER_PALETTE_ITEM,
  type StepCatalogItem,
} from '../stepCatalog';
import { PALETTE_ITEMS } from '../store/journeyBuilderStore';
import type { JourneyNodeType } from '../types';

export { PALETTE_ITEMS, TRIGGER_PALETTE_ITEM, JOURNEY_STEP_CATALOG };
export type { StepCatalogItem };

export function filterPaletteItems(
  items: StepCatalogItem[],
  options: {
    query?: string;
    hasTrigger?: boolean;
    excludeTrigger?: boolean;
  } = {}
): StepCatalogItem[] {
  const q = options.query?.trim().toLowerCase() ?? '';
  const hasTrigger = options.hasTrigger ?? false;
  const excludeTrigger = options.excludeTrigger ?? false;

  return items.filter((item) => {
    if (item.type === 'TRIGGER') {
      if (hasTrigger || excludeTrigger) return false;
    }
    if (!q) return true;
    return (
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
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

export type StepCatalogSelectHandler = (type: JourneyNodeType) => void;
