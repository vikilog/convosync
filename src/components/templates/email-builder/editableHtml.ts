import type { EmailBlock } from './types';
import { sanitizeEmailHtml } from '../../../lib/sanitizeHtml';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Human-editable HTML fragments (no email table wrapper). */
export function blocksToEditableHtml(blocks: EmailBlock[]): string {
  if (blocks.length === 0) return '';
  if (blocks.length === 1 && blocks[0].type === 'html') {
    return String(blocks[0].props.rawHtml ?? '');
  }
  return blocks.map(blockToSimpleHtml).filter(Boolean).join('\n\n');
}

function blockToSimpleHtml(block: EmailBlock): string {
  const p = block.props;
  switch (block.type) {
    case 'header': {
      const tag = (p.level as string) === 'h2' ? 'h2' : 'h1';
      const align = p.align ? ` style="text-align:${p.align}"` : '';
      return `<${tag}${align}>${esc(String(p.text ?? ''))}</${tag}>`;
    }
    case 'text':
      return `<p style="line-height:1.6;">${esc(String(p.content ?? '')).replace(/\n/g, '<br/>')}</p>`;
    case 'image': {
      const src = String(p.src ?? '');
      const alt = esc(String(p.alt ?? ''));
      const link = String(p.link ?? '');
      const img = `<img src="${esc(src)}" alt="${alt}" style="max-width:100%;height:auto;" />`;
      return link ? `<a href="${esc(link)}">${img}</a>` : img;
    }
    case 'button':
      return `<a href="${esc(String(p.url ?? '#'))}" style="display:inline-block;background:#064e3b;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">${esc(String(p.label ?? 'Button'))}</a>`;
    case 'columns':
      return `<table width="100%"><tr><td width="50%" valign="top">${esc(String(p.left ?? ''))}</td><td width="50%" valign="top">${esc(String(p.right ?? ''))}</td></tr></table>`;
    case 'divider':
      return `<hr style="border:none;border-top:1px solid ${String(p.color ?? '#e2e8f0')};" />`;
    case 'spacer':
      return `<div style="height:${Number(p.height) || 24}px;"></div>`;
    case 'footer':
      return `<p style="font-size:12px;color:#9ca3af;text-align:center;">${esc(String(p.text ?? ''))}</p>`;
    case 'html':
      return sanitizeEmailHtml(String(p.rawHtml ?? ''));
    default:
      return '';
  }
}

export function htmlToSingleBlock(rawHtml: string): EmailBlock {
  return {
    id: `blk_${Date.now().toString(36)}`,
    type: 'html',
    props: { rawHtml: rawHtml.trim() },
  };
}
