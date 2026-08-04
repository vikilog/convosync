import { create } from 'zustand';

type BuilderState = {
  isDirty: boolean;
  saving: boolean;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
};

export const useIgBuilderStore = create<BuilderState>((set) => ({
  isDirty: false,
  saving: false,
  setDirty: (isDirty) => set({ isDirty }),
  setSaving: (saving) => set({ saving }),
}));
