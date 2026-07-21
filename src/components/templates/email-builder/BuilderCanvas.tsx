import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useEmailBuilderStore } from './store';
import { CanvasBlock } from './CanvasBlock';
import type { BlockType } from './types';

const PALETTE_TYPE = 'application/x-convosync-block-type';

export function BuilderCanvas() {
  const blocks = useEmailBuilderStore((s) => s.blocks);
  const brand = useEmailBuilderStore((s) => s.brand);
  const selectedBlockId = useEmailBuilderStore((s) => s.selectedBlockId);
  const dropIndex = useEmailBuilderStore((s) => s.dropIndex);
  const addBlock = useEmailBuilderStore((s) => s.addBlock);
  const selectBlock = useEmailBuilderStore((s) => s.selectBlock);
  const removeBlock = useEmailBuilderStore((s) => s.removeBlock);
  const duplicateBlock = useEmailBuilderStore((s) => s.duplicateBlock);
  const reorderBlock = useEmailBuilderStore((s) => s.reorderBlock);
  const setDropIndex = useEmailBuilderStore((s) => s.setDropIndex);

  const [dragBlockIndex, setDragBlockIndex] = useState<number | null>(null);

  const handleCanvasDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const blockType = e.dataTransfer.getData(PALETTE_TYPE) as BlockType;
    if (blockType) {
      addBlock(blockType, index);
      return;
    }
    if (dragBlockIndex !== null) {
      reorderBlock(dragBlockIndex, index > dragBlockIndex ? index - 1 : index);
      setDragBlockIndex(null);
    }
    setDropIndex(null);
  };

  const DropZone = ({ index }: { index: number }) => (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDropIndex(index);
      }}
      onDragLeave={() => setDropIndex(null)}
      onDrop={(e) => handleCanvasDrop(e, index)}
      className={`transition-all rounded-lg ${
        dropIndex === index ? 'h-10 bg-primary/10 border-2 border-dashed border-primary' : 'h-2'
      }`}
    />
  );

  return (
    <div
      className="flex-1 min-h-0 min-w-0 overflow-y-auto bg-[#eceff4] p-4 md:p-6"
      onClick={() => selectBlock(null)}
    >
      <div
        className="w-full max-w-[640px] mx-auto min-h-full bg-white rounded-xl shadow-sm border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {brand.logoUrl ? (
          <div className="pt-6 px-6 text-center">
            <img src={brand.logoUrl} alt={brand.companyName} className="h-9 mx-auto" />
          </div>
        ) : null}

        {blocks.length === 0 ? (
          <div
            className="m-6 p-12 border-2 border-dashed border-[#dadde1] rounded-xl text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleCanvasDrop(e, 0)}
          >
            <p className="text-sm font-semibold text-gray-600">Drag blocks here</p>
            <p className="text-xs text-gray-400 mt-1">Or pick from the left panel</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                addBlock('text');
              }}
              className="mt-4 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary hover:bg-primary-hover text-white text-sm font-bold"
            >
              <Plus className="w-3.5 h-3.5" /> Add text block
            </button>
          </div>
        ) : (
          <div className="py-4 px-3 sm:px-5 space-y-1">
            <DropZone index={0} />
            {blocks.map((block, index) => (
              <React.Fragment key={block.id}>
                <CanvasBlock
                  block={block}
                  brand={brand}
                  selected={selectedBlockId === block.id}
                  onSelect={() => selectBlock(block.id)}
                  onRemove={() => removeBlock(block.id)}
                  onDuplicate={() => duplicateBlock(block.id)}
                  dragHandlers={{
                    draggable: true,
                    onDragStart: (e) => {
                      setDragBlockIndex(index);
                      e.dataTransfer.effectAllowed = 'move';
                    },
                    onDragEnd: () => setDragBlockIndex(null),
                  }}
                />
                <DropZone index={index + 1} />
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { PALETTE_TYPE };
