import React, { useState } from 'react';
import {
  Bookmark,
  Braces,
  LayoutGrid,
  Layers,
  Palette,
  Trash2,
} from 'lucide-react';
import { BLOCK_DEFINITIONS } from './blockRegistry';
import { TEMPLATE_GALLERY } from './gallery';
import {
  BUILTIN_SECTIONS,
  deleteSection,
  loadSavedSections,
  saveSection,
  type SavedSection,
} from './sections';
import { useEmailBuilderStore } from './store';
import { PALETTE_TYPE } from './BuilderCanvas';
import type { LeftPanelTab } from './types';
import { VariablePreviewForm } from './VariablePreviewForm';

const TABS: { id: LeftPanelTab; label: string; icon: React.ReactNode }[] = [
  { id: 'blocks', label: 'Blocks', icon: <LayoutGrid className="w-4 h-4" /> },
  { id: 'gallery', label: 'Gallery', icon: <Layers className="w-4 h-4" /> },
  { id: 'sections', label: 'Saved', icon: <Bookmark className="w-4 h-4" /> },
  { id: 'variables', label: 'Vars', icon: <Braces className="w-4 h-4" /> },
  { id: 'brand', label: 'Brand', icon: <Palette className="w-4 h-4" /> },
];

function BlockPaletteItem({
  label,
  description,
  icon,
  type,
}: {
  label: string;
  description: string;
  icon: string;
  type: string;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(PALETTE_TYPE, type);
        e.dataTransfer.effectAllowed = 'copy';
      }}
      className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-primary/40 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all"
    >
      <span className="shrink-0 w-9 h-9 rounded-lg bg-[#eef2ff] text-primary text-sm font-black flex items-center justify-center">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 truncate">{description}</p>
      </div>
    </div>
  );
}

export function LeftSidebar() {
  const leftTab = useEmailBuilderStore((s) => s.leftTab);
  const setLeftTab = useEmailBuilderStore((s) => s.setLeftTab);
  const addBlock = useEmailBuilderStore((s) => s.addBlock);
  const insertBlocks = useEmailBuilderStore((s) => s.insertBlocks);
  const applyGallery = useEmailBuilderStore((s) => s.applyGallery);
  const blocks = useEmailBuilderStore((s) => s.blocks);
  const brand = useEmailBuilderStore((s) => s.brand);
  const setBrand = useEmailBuilderStore((s) => s.setBrand);
  const selectedBlockId = useEmailBuilderStore((s) => s.selectedBlockId);

  const [sections, setSections] = useState<SavedSection[]>(() => loadSavedSections());
  const [sectionName, setSectionName] = useState('');

  const handleSaveSection = () => {
    const selected = selectedBlockId
      ? blocks.filter((b) => b.id === selectedBlockId)
      : blocks.slice(-2);
    if (!selected.length) return;
    const name = sectionName.trim() || `Section ${sections.length + 1}`;
    setSections(saveSection(name, selected));
    setSectionName('');
  };

  return (
    <aside className="w-[300px] shrink-0 border-r border-slate-200 bg-[#fafbfc] flex flex-col min-h-0">
      <div className="grid grid-cols-5 border-b border-slate-200 bg-white">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setLeftTab(tab.id)}
            title={tab.label}
            className={`min-w-0 py-2 px-0.5 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold leading-tight ${
              leftTab === tab.id
                ? 'text-primary border-b-2 border-primary bg-primary/[0.04]'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
            }`}
          >
            {tab.icon}
            <span className="w-full truncate text-center">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {leftTab === 'blocks' && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 px-1 mb-2">Drag blocks onto the canvas</p>
            {BLOCK_DEFINITIONS.map((b) => (
              <BlockPaletteItem key={b.type} {...b} type={b.type} />
            ))}
          </div>
        )}

        {leftTab === 'gallery' && (
          <div className="space-y-3">
            {TEMPLATE_GALLERY.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyGallery(t.design, t.subject)}
                className="w-full text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-primary/40 hover:shadow-sm transition-all"
              >
                <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                <span className="inline-block mt-2 text-sm font-bold uppercase tracking-wide text-primary bg-[#eef2ff] px-2 py-0.5 rounded">
                  {t.category}
                </span>
              </button>
            ))}
          </div>
        )}

        {leftTab === 'sections' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl border border-dashed border-[#dadde1] bg-white">
              <p className="text-sm font-semibold text-gray-700 mb-2">Save reusable section</p>
              <input
                className="w-full mb-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                placeholder="Section name"
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
              />
              <button
                type="button"
                onClick={handleSaveSection}
                className="w-full py-1.5 rounded-lg bg-primary text-white text-sm font-bold"
              >
                Save {selectedBlockId ? 'selected block' : 'last blocks'}
              </button>
            </div>

            <div>
              <p className="text-meta font-bold uppercase text-gray-400 mb-2">Built-in</p>
              <div className="space-y-2">
                {BUILTIN_SECTIONS.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => insertBlocks(s.blocks)}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-primary/30 text-sm font-medium text-gray-800"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {sections.length > 0 && (
              <div>
                <p className="text-meta font-bold uppercase text-gray-400 mb-2">Your sections</p>
                <div className="space-y-2">
                  {sections.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-white"
                    >
                      <button
                        type="button"
                        onClick={() => insertBlocks(s.blocks)}
                        className="flex-1 text-left text-sm font-medium text-gray-800 truncate"
                      >
                        {s.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSections(deleteSection(s.id))}
                        className="p-1 text-gray-400 hover:text-red-500"
                        aria-label="Delete section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {leftTab === 'variables' && <VariablePreviewForm compact />}

        {leftTab === 'brand' && (
          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-sm font-semibold text-gray-600">Company name</span>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={brand.companyName}
                onChange={(e) => setBrand({ companyName: e.target.value })}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-semibold text-gray-600">Logo URL</span>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={brand.logoUrl}
                onChange={(e) => setBrand({ logoUrl: e.target.value })}
                placeholder="https://..."
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-semibold text-gray-600">Primary color</span>
              <input
                type="color"
                className="h-10 w-full rounded border border-slate-200"
                value={brand.primaryColor}
                onChange={(e) => setBrand({ primaryColor: e.target.value })}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-semibold text-gray-600">Text color</span>
              <input
                type="color"
                className="h-10 w-full rounded border border-slate-200"
                value={brand.textColor}
                onChange={(e) => setBrand({ textColor: e.target.value })}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-semibold text-gray-600">Email background</span>
              <input
                type="color"
                className="h-10 w-full rounded border border-slate-200"
                value={brand.backgroundColor}
                onChange={(e) => setBrand({ backgroundColor: e.target.value })}
              />
            </label>
            <button
              type="button"
              onClick={() => addBlock('header')}
              className="w-full py-2 text-sm font-bold text-primary border border-primary/20 rounded-lg"
            >
              Quick add branded header
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
