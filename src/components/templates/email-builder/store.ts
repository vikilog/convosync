import { create } from 'zustand';
import type { BrandSettings, EmailBlock, EmailDesignDocument, LeftPanelTab } from './types';
import { DEFAULT_BRAND } from './types';
import { createBlock, createBlockId } from './blockRegistry';
import type { BlockType } from './types';
import { getWorkspaceId } from '../../../lib/api';

const BRAND_KEY = 'convosync_email_brand';

function loadBrand(): BrandSettings {
  try {
    const ws = getWorkspaceId() ?? 'default';
    const raw = localStorage.getItem(`${BRAND_KEY}_${ws}`);
    if (raw) return { ...DEFAULT_BRAND, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_BRAND };
}

function persistBrand(brand: BrandSettings) {
  const ws = getWorkspaceId() ?? 'default';
  localStorage.setItem(`${BRAND_KEY}_${ws}`, JSON.stringify(brand));
}

type BuilderState = {
  name: string;
  subject: string;
  status: 'draft' | 'active';
  blocks: EmailBlock[];
  brand: BrandSettings;
  selectedBlockId: string | null;
  previewMode: 'desktop' | 'mobile';
  leftTab: LeftPanelTab;
  dropIndex: number | null;
  /** User-filled values for live preview (not saved with template). */
  previewVariables: Record<string, string>;
  setMeta: (p: Partial<Pick<BuilderState, 'name' | 'subject' | 'status'>>) => void;
  initDesign: (design: EmailDesignDocument, meta?: { name?: string; subject?: string; status?: 'draft' | 'active' }) => void;
  setLeftTab: (tab: LeftPanelTab) => void;
  setPreviewMode: (mode: 'desktop' | 'mobile') => void;
  selectBlock: (id: string | null) => void;
  setDropIndex: (index: number | null) => void;
  addBlock: (type: BlockType, index?: number) => void;
  insertBlocks: (blocks: EmailBlock[], index?: number) => void;
  updateBlock: (id: string, props: Record<string, unknown>) => void;
  removeBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  moveBlock: (id: string, direction: -1 | 1) => void;
  reorderBlock: (fromIndex: number, toIndex: number) => void;
  setBrand: (brand: Partial<BrandSettings>) => void;
  applyGallery: (design: EmailDesignDocument, subject: string) => void;
  setHtmlSource: (rawHtml: string) => void;
  setPreviewVariable: (key: string, value: string) => void;
  resetPreviewVariables: () => void;
};

export const useEmailBuilderStore = create<BuilderState>((set, get) => ({
  name: '',
  subject: 'Welcome to {{company_name}}',
  status: 'draft',
  blocks: [],
  brand: loadBrand(),
  selectedBlockId: null,
  previewMode: 'desktop',
  leftTab: 'blocks',
  dropIndex: null,
  previewVariables: {},

  setMeta: (p) => set(p),

  initDesign: (design, meta) =>
    set({
      blocks: design.blocks,
      brand: design.brand,
      name: meta?.name ?? get().name,
      subject: meta?.subject ?? get().subject,
      status: meta?.status ?? get().status,
      selectedBlockId: design.blocks[0]?.id ?? null,
      previewVariables: {},
    }),

  setPreviewVariable: (key, value) =>
    set({
      previewVariables: { ...get().previewVariables, [key]: value },
    }),

  resetPreviewVariables: () => set({ previewVariables: {} }),

  setLeftTab: (leftTab) => set({ leftTab }),
  setPreviewMode: (previewMode) => set({ previewMode }),
  selectBlock: (selectedBlockId) => set({ selectedBlockId }),
  setDropIndex: (dropIndex) => set({ dropIndex }),

  addBlock: (type, index) => {
    const block = createBlock(type);
    const blocks = [...get().blocks];
    const at = index ?? blocks.length;
    blocks.splice(at, 0, block);
    set({ blocks, selectedBlockId: block.id, dropIndex: null });
  },

  insertBlocks: (incoming, index) => {
    const cloned = incoming.map((b) => ({
      ...b,
      id: createBlockId(),
      props: { ...b.props },
    }));
    const blocks = [...get().blocks];
    const at = index ?? blocks.length;
    blocks.splice(at, 0, ...cloned);
    set({ blocks, selectedBlockId: cloned[0]?.id ?? get().selectedBlockId });
  },

  updateBlock: (id, props) =>
    set({
      blocks: get().blocks.map((b) =>
        b.id === id ? { ...b, props: { ...b.props, ...props } } : b
      ),
    }),

  removeBlock: (id) => {
    const blocks = get().blocks.filter((b) => b.id !== id);
    set({
      blocks,
      selectedBlockId: get().selectedBlockId === id ? blocks[0]?.id ?? null : get().selectedBlockId,
    });
  },

  duplicateBlock: (id) => {
    const idx = get().blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const copy = {
      ...get().blocks[idx],
      id: createBlockId(),
      props: { ...get().blocks[idx].props },
    };
    const blocks = [...get().blocks];
    blocks.splice(idx + 1, 0, copy);
    set({ blocks, selectedBlockId: copy.id });
  },

  moveBlock: (id, direction) => {
    const blocks = [...get().blocks];
    const idx = blocks.findIndex((b) => b.id === id);
    const next = idx + direction;
    if (idx < 0 || next < 0 || next >= blocks.length) return;
    const [item] = blocks.splice(idx, 1);
    blocks.splice(next, 0, item);
    set({ blocks });
  },

  reorderBlock: (fromIndex, toIndex) => {
    const blocks = [...get().blocks];
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const [item] = blocks.splice(fromIndex, 1);
    blocks.splice(toIndex, 0, item);
    set({ blocks, dropIndex: null });
  },

  setBrand: (partial) => {
    const brand = { ...get().brand, ...partial };
    persistBrand(brand);
    set({ brand });
  },

  applyGallery: (design, subject) => {
    const blocks = design.blocks.map((b) => ({ ...b, id: createBlockId() }));
    set({
      blocks,
      brand: design.brand,
      subject,
      selectedBlockId: blocks[0]?.id ?? null,
    });
  },

  setHtmlSource: (rawHtml) => {
    const blocks = get().blocks;
    if (blocks.length === 1 && blocks[0].type === 'html') {
      set({
        blocks: [{ ...blocks[0], props: { ...blocks[0].props, rawHtml } }],
      });
      return;
    }
    const id = createBlockId();
    set({
      blocks: [{ id, type: 'html', props: { rawHtml } }],
      selectedBlockId: id,
    });
  },
}));
