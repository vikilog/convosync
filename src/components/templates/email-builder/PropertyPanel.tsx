import React from 'react';
import { Settings2 } from 'lucide-react';
import { useEmailBuilderStore } from './store';
import { getBlockDefinition } from './blockRegistry';
import type { BlockType, TextAlign } from './types';

const ALIGNS: TextAlign[] = ['left', 'center', 'right'];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-meta font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary';

export function PropertyPanel() {
  const blocks = useEmailBuilderStore((s) => s.blocks);
  const selectedBlockId = useEmailBuilderStore((s) => s.selectedBlockId);
  const brand = useEmailBuilderStore((s) => s.brand);
  const updateBlock = useEmailBuilderStore((s) => s.updateBlock);

  const block = blocks.find((b) => b.id === selectedBlockId);

  if (!block) {
    return (
      <aside className="w-[300px] shrink-0 border-l border-slate-200 bg-white flex flex-col">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-bold text-gray-900">Properties</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Settings2 className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">Select a block on the canvas to edit its properties.</p>
        </div>
      </aside>
    );
  }

  const def = getBlockDefinition(block.type);
  const p = block.props;

  const set = (props: Record<string, unknown>) => updateBlock(block.id, props);

  const alignField = (
    <Field label="Alignment">
      <div className="flex gap-1">
        {ALIGNS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => set({ align: a })}
            className={`flex-1 py-1.5 text-sm font-semibold rounded-md capitalize ${
              (p.align ?? 'left') === a
                ? 'bg-primary text-white'
                : 'bg-[#f4f5f7] text-gray-600 hover:bg-primary/10'
            }`}
          >
            {a}
          </button>
        ))}
      </div>
    </Field>
  );

  const renderFields = () => {
    switch (block.type as BlockType) {
      case 'header':
        return (
          <>
            <Field label="Heading text">
              <input
                className={inputCls}
                value={String(p.text ?? '')}
                onChange={(e) => set({ text: e.target.value })}
              />
            </Field>
            <Field label="Level">
              <select
                className={inputCls}
                value={String(p.level ?? 'h1')}
                onChange={(e) => set({ level: e.target.value })}
              >
                <option value="h1">Large (H1)</option>
                <option value="h2">Medium (H2)</option>
              </select>
            </Field>
            {alignField}
            <Field label="Color (optional)">
              <input
                type="color"
                className="h-9 w-full rounded border border-slate-200"
                value={String(p.color || brand.textColor)}
                onChange={(e) => set({ color: e.target.value })}
              />
            </Field>
          </>
        );
      case 'text':
        return (
          <>
            <Field label="Content">
              <textarea
                className={`${inputCls} min-h-[120px] resize-y`}
                value={String(p.content ?? '')}
                onChange={(e) => set({ content: e.target.value })}
              />
            </Field>
            {alignField}
            <Field label="Font size">
              <input
                type="number"
                min={12}
                max={24}
                className={inputCls}
                value={Number(p.fontSize) || 16}
                onChange={(e) => set({ fontSize: Number(e.target.value) })}
              />
            </Field>
          </>
        );
      case 'image':
        return (
          <>
            <Field label="Image URL">
              <input
                className={inputCls}
                value={String(p.src ?? '')}
                onChange={(e) => set({ src: e.target.value })}
                placeholder="https://..."
              />
            </Field>
            <Field label="Alt text">
              <input
                className={inputCls}
                value={String(p.alt ?? '')}
                onChange={(e) => set({ alt: e.target.value })}
              />
            </Field>
            <Field label="Link URL (optional)">
              <input
                className={inputCls}
                value={String(p.link ?? '')}
                onChange={(e) => set({ link: e.target.value })}
                placeholder="{{cta_url}}"
              />
            </Field>
            {alignField}
          </>
        );
      case 'button':
        return (
          <>
            <Field label="Button label">
              <input
                className={inputCls}
                value={String(p.label ?? '')}
                onChange={(e) => set({ label: e.target.value })}
              />
            </Field>
            <Field label="Link URL">
              <input
                className={inputCls}
                value={String(p.url ?? '')}
                onChange={(e) => set({ url: e.target.value })}
                placeholder="{{cta_url}}"
              />
            </Field>
            {alignField}
            <Field label="Style preset">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'primary', bg: brand.primaryColor, fg: '#ffffff' },
                  { id: 'outline', bg: '#ffffff', fg: brand.primaryColor },
                  { id: 'dark', bg: '#1c1e21', fg: '#ffffff' },
                  { id: 'soft', bg: '#e8f0ec', fg: brand.primaryColor },
                ].map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() =>
                      set({
                        variant: v.id,
                        bgColor: v.bg,
                        textColor: v.fg,
                        borderRadius: v.id === 'outline' ? 8 : 8,
                      })
                    }
                    className="py-2 rounded-lg text-sm font-bold border border-slate-200"
                    style={{ background: v.bg, color: v.fg }}
                  >
                    {v.id}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Background">
              <input
                type="color"
                className="h-9 w-full rounded border border-slate-200"
                value={String(p.bgColor || brand.primaryColor)}
                onChange={(e) => set({ bgColor: e.target.value })}
              />
            </Field>
            <Field label="Corner radius">
              <input
                type="range"
                min={0}
                max={24}
                value={Number(p.borderRadius) || 8}
                onChange={(e) => set({ borderRadius: Number(e.target.value) })}
                className="w-full"
              />
            </Field>
          </>
        );
      case 'columns':
        return (
          <>
            <Field label="Left column">
              <textarea
                className={`${inputCls} min-h-[80px]`}
                value={String(p.left ?? '')}
                onChange={(e) => set({ left: e.target.value })}
              />
            </Field>
            <Field label="Right column">
              <textarea
                className={`${inputCls} min-h-[80px]`}
                value={String(p.right ?? '')}
                onChange={(e) => set({ right: e.target.value })}
              />
            </Field>
          </>
        );
      case 'divider':
        return (
          <Field label="Line color">
            <input
              type="color"
              className="h-9 w-full rounded border border-slate-200"
              value={String(p.color ?? '#e2e8f0')}
              onChange={(e) => set({ color: e.target.value })}
            />
          </Field>
        );
      case 'spacer':
        return (
          <Field label="Height (px)">
            <input
              type="number"
              min={8}
              max={120}
              className={inputCls}
              value={Number(p.height) || 24}
              onChange={(e) => set({ height: Number(e.target.value) })}
            />
          </Field>
        );
      case 'footer':
        return (
          <>
            <Field label="Footer text">
              <textarea
                className={`${inputCls} min-h-[80px]`}
                value={String(p.text ?? '')}
                onChange={(e) => set({ text: e.target.value })}
              />
            </Field>
            {alignField}
          </>
        );
      case 'html':
        return (
          <Field label="Raw HTML">
            <textarea
              className={`${inputCls} min-h-[200px] font-mono text-xs`}
              value={String(p.rawHtml ?? '')}
              onChange={(e) => set({ rawHtml: e.target.value })}
            />
          </Field>
        );
      default:
        return null;
    }
  };

  return (
    <aside className="w-[300px] shrink-0 border-l border-slate-200 bg-white flex flex-col min-h-0">
      <div className="px-4 py-3 border-b border-slate-200">
        <p className="text-meta font-semibold uppercase tracking-wide text-primary">{def.label}</p>
        <h3 className="text-sm font-bold text-gray-900">Block properties</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">{renderFields()}</div>
    </aside>
  );
}
