import type { BlockType, EmailBlock } from './types';
import { createBlockId, getBlockDefinition } from './blockRegistry';

const VALID_TYPES = new Set<BlockType>([
  'header',
  'text',
  'image',
  'button',
  'divider',
  'spacer',
  'columns',
  'footer',
  'html',
]);

export type AiEmailBlockSuggestion = {
  type: string;
  props?: Record<string, unknown>;
};

export type AiEmailGenerateResult = {
  subject?: string;
  blocks?: AiEmailBlockSuggestion[];
  html?: string;
};

function asBlockType(raw: string): BlockType | null {
  const t = raw.trim().toLowerCase() as BlockType;
  return VALID_TYPES.has(t) ? t : null;
}

/** Map AI JSON → builder blocks (merge with defaults so props stay valid). */
export function blocksFromAiResult(result: AiEmailGenerateResult): EmailBlock[] {
  if (typeof result.html === 'string' && result.html.trim()) {
    return [
      {
        id: createBlockId(),
        type: 'html',
        props: { ...getBlockDefinition('html').defaultProps, rawHtml: result.html.trim() },
      },
    ];
  }

  const incoming = Array.isArray(result.blocks) ? result.blocks : [];
  const out: EmailBlock[] = [];
  for (const item of incoming) {
    const type = asBlockType(String(item?.type ?? ''));
    if (!type) continue;
    const defaults = getBlockDefinition(type).defaultProps;
    out.push({
      id: createBlockId(),
      type,
      props: { ...defaults, ...(item.props ?? {}) },
    });
  }
  return out;
}
