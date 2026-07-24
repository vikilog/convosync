import React, { useMemo } from 'react';
import { Copy, GripVertical, Trash2 } from 'lucide-react';
import type { BrandSettings, EmailBlock } from './types';
import { isFullHtmlDocument } from './renderHtml';

type Props = {
  block: EmailBlock;
  brand: BrandSettings;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  dragHandlers: {
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: () => void;
  };
};

export function CanvasBlock({
  block,
  brand,
  selected,
  onSelect,
  onRemove,
  onDuplicate,
  dragHandlers,
}: Props) {
  const primary = brand.primaryColor;
  const htmlRaw = block.type === 'html' ? String(block.props.rawHtml ?? '') : '';
  const fullHtmlDoc = block.type === 'html' && isFullHtmlDocument(htmlRaw);
  const htmlSrcDoc = useMemo(() => (fullHtmlDoc ? htmlRaw : ''), [fullHtmlDoc, htmlRaw]);

  const renderContent = () => {
    const p = block.props;
    switch (block.type) {
      case 'header': {
        const Tag = (p.level as string) === 'h2' ? 'h2' : 'h1';
        return (
          <Tag
            className="font-bold text-gray-900"
            style={{
              fontSize: (p.level as string) === 'h2' ? 20 : 26,
              textAlign: (p.align as React.CSSProperties['textAlign']) ?? 'left',
              color: (p.color as string) || brand.textColor,
            }}
          >
            {String(p.text ?? '')}
          </Tag>
        );
      }
      case 'text':
        return (
          <p
            className="text-gray-700 whitespace-pre-wrap leading-relaxed"
            style={{
              textAlign: (p.align as React.CSSProperties['textAlign']) ?? 'left',
              fontSize: Number(p.fontSize) || 16,
            }}
          >
            {String(p.content ?? '')}
          </p>
        );
      case 'image':
        return (
          <div style={{ textAlign: (p.align as React.CSSProperties['textAlign']) ?? 'center' }}>
            <img
              src={String(p.src ?? '')}
              alt={String(p.alt ?? '')}
              className="max-w-full h-auto rounded-lg border border-black/5"
            />
          </div>
        );
      case 'button':
        return (
          <div style={{ textAlign: (p.align as React.CSSProperties['textAlign']) ?? 'center' }}>
            <span
              className="inline-block px-7 py-3 rounded-lg font-semibold text-sm"
              style={{
                background: (p.bgColor as string) || primary,
                color: String(p.textColor ?? '#fff'),
                borderRadius: Number(p.borderRadius) || 8,
              }}
            >
              {String(p.label ?? 'Button')}
            </span>
          </div>
        );
      case 'columns':
        return (
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
            <div className="whitespace-pre-wrap">{String(p.left ?? '')}</div>
            <div className="whitespace-pre-wrap">{String(p.right ?? '')}</div>
          </div>
        );
      case 'divider':
        return <hr style={{ borderColor: String(p.color ?? '#e2e8f0') }} className="border-t" />;
      case 'spacer':
        return <div style={{ height: Number(p.height) || 24 }} />;
      case 'footer':
        return (
          <p
            className="text-xs text-gray-400"
            style={{ textAlign: (p.align as React.CSSProperties['textAlign']) ?? 'center' }}
          >
            {String(p.text ?? '')}
          </p>
        );
      case 'html':
        if (fullHtmlDoc) {
          return (
            <iframe
              title="Email HTML preview"
              srcDoc={htmlSrcDoc}
              className="w-full min-h-[calc(100dvh-7rem)] h-full border-0 bg-white block"
              sandbox=""
            />
          );
        }
        return (
          <div
            className="prose prose-sm max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: htmlRaw }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.stopPropagation();
          onSelect();
        }
      }}
      className={`group relative rounded-xl transition-all ${
        fullHtmlDoc ? 'mx-0 overflow-hidden' : 'mx-1'
      } ${
        selected
          ? 'ring-2 ring-primary shadow-md shadow-primary/10'
          : 'ring-1 ring-transparent hover:ring-black/10 hover:shadow-sm'
      }`}
    >
      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex flex-col gap-0.5 z-10">
        <button
          type="button"
          {...dragHandlers}
          className="p-1 rounded-md bg-surface border border-black/5 text-gray-400 cursor-grab active:cursor-grabbing"
          aria-label="Drag block"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 flex gap-1 z-10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="p-1 rounded-full bg-surface border border-black/5 text-gray-500 hover:text-primary"
          aria-label="Duplicate"
        >
          <Copy className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 rounded-full bg-surface border border-red-100 text-red-500"
          aria-label="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      <div className={fullHtmlDoc ? 'bg-surface' : 'px-6 py-4 bg-surface'}>{renderContent()}</div>
    </div>
  );
}
