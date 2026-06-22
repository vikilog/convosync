import type { BlockDefinition, BlockType } from './types';

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    type: 'header',
    label: 'Heading',
    description: 'Title or section header',
    icon: 'H',
    defaultProps: { text: 'Hello {{first_name}}', level: 'h1', align: 'left', color: '' },
  },
  {
    type: 'text',
    label: 'Text',
    description: 'Paragraph copy',
    icon: 'T',
    defaultProps: {
      content:
        'Write your message here. Use {{variables}} for personalization.',
      align: 'left',
      fontSize: 16,
    },
  },
  {
    type: 'image',
    label: 'Image',
    description: 'Banner or product image',
    icon: 'IMG',
    defaultProps: {
      src: 'https://placehold.co/560x200/e8e6f0/412cdd?text=Image',
      alt: 'Image',
      width: '100%',
      link: '',
      align: 'center',
    },
  },
  {
    type: 'button',
    label: 'CTA Button',
    description: 'Call-to-action link',
    icon: 'CTA',
    defaultProps: {
      label: 'Get started',
      url: '{{cta_url}}',
      align: 'center',
      variant: 'primary',
      bgColor: '',
      textColor: '#ffffff',
      borderRadius: 8,
    },
  },
  {
    type: 'columns',
    label: '2 Columns',
    description: 'Side-by-side content',
    icon: '2col',
    defaultProps: {
      left: 'Left column content with {{first_name}}',
      right: 'Right column content',
      gap: 16,
    },
  },
  {
    type: 'divider',
    label: 'Divider',
    description: 'Horizontal rule',
    icon: '—',
    defaultProps: { color: '#e2e8f0', thickness: 1 },
  },
  {
    type: 'spacer',
    label: 'Spacer',
    description: 'Vertical spacing',
    icon: '↕',
    defaultProps: { height: 24 },
  },
  {
    type: 'footer',
    label: 'Footer',
    description: 'Legal or unsubscribe text',
    icon: 'F',
    defaultProps: {
      text: '© {{company_name}} · You received this email because you signed up.',
      align: 'center',
    },
  },
  {
    type: 'html',
    label: 'Custom HTML',
    description: 'Paste your own HTML markup',
    icon: '</>',
    defaultProps: {
      rawHtml: `<h2 style="margin:0 0 12px;font-size:22px;">Hello {{first_name}},</h2>
<p style="margin:0 0 16px;line-height:1.6;color:#374151;">Your custom HTML content goes here.</p>
<a href="{{cta_url}}" style="display:inline-block;background:#0284c7;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Get started</a>`,
    },
  },
];

export function getBlockDefinition(type: BlockType): BlockDefinition {
  return (
    BLOCK_DEFINITIONS.find((b) => b.type === type) ?? {
      type: 'text',
      label: 'Text',
      description: '',
      icon: 'T',
      defaultProps: { content: '' },
    }
  );
}

export function createBlockId(): string {
  return `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createBlock(type: BlockType): import('./types').EmailBlock {
  const def = getBlockDefinition(type);
  return { id: createBlockId(), type, props: { ...def.defaultProps } };
}
