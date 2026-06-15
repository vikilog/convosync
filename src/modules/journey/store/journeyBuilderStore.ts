import { create } from 'zustand';
import type { JourneyNodeType } from '../types';
import { JOURNEY_STEP_CATALOG, TRIGGER_PALETTE_ITEM, type StepCatalogItem } from '../stepCatalog';

type BuilderState = {
  selectedNodeId: string | null;
  isDirty: boolean;
  saving: boolean;
  setSelectedNodeId: (id: string | null) => void;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
};

export const useJourneyBuilderStore = create<BuilderState>((set) => ({
  selectedNodeId: null,
  isDirty: false,
  saving: false,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setDirty: (isDirty) => set({ isDirty }),
  setSaving: (saving) => set({ saving }),
}));

export type PaletteItem = StepCatalogItem;

export const PALETTE_ITEMS: PaletteItem[] = [TRIGGER_PALETTE_ITEM, ...JOURNEY_STEP_CATALOG];

export type { StepCatalogItem };
