import type { EmailDesignDocument } from './types';
import { createBlock } from './blockRegistry';
import { DEFAULT_BRAND } from './types';

export type GalleryTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  subject: string;
  design: EmailDesignDocument;
};

function doc(blocks: ReturnType<typeof createBlock>[], subject: string): GalleryTemplate {
  return {
    id: `gal_${subject.replace(/\s+/g, '_').toLowerCase()}`,
    name: subject.split(' ').slice(0, 4).join(' '),
    description: 'Starter layout',
    category: 'Featured',
    subject,
    design: { version: 1, blocks, brand: { ...DEFAULT_BRAND } },
  };
}

export const TEMPLATE_GALLERY: GalleryTemplate[] = [
  (() => {
    const h = createBlock('header');
    h.props = { text: 'Welcome to {{company_name}}', level: 'h1', align: 'center', color: '' };
    const t = createBlock('text');
    t.props = {
      content:
        'Hi {{first_name}},\n\nWe are thrilled to have you. Explore your dashboard and start connecting with customers today.',
      align: 'left',
      fontSize: 16,
    };
    const b = createBlock('button');
    b.props = { label: 'Open dashboard', url: '{{cta_url}}', align: 'center', variant: 'primary' };
    const f = createBlock('footer');
    return doc([h, t, b, f], 'Welcome to {{company_name}}');
  })(),
  (() => {
    const h = createBlock('header');
    h.props = { text: 'Your order is confirmed', level: 'h1', align: 'left', color: '' };
    const t = createBlock('text');
    t.props = {
      content: 'Order {{order_id}} is on its way. We will notify you when it ships.',
      align: 'left',
      fontSize: 16,
    };
    const img = createBlock('image');
    const cols = createBlock('columns');
    cols.props = { left: 'Shipping to:\n{{first_name}}', right: 'Estimated delivery:\n2–3 days' };
    const b = createBlock('button');
    b.props = { label: 'Track order', url: '{{cta_url}}', align: 'left', variant: 'primary' };
    return doc([h, t, img, cols, b, createBlock('footer')], 'Order {{order_id}} confirmed');
  })(),
  (() => {
    const h = createBlock('header');
    h.props = { text: 'We miss you, {{first_name}}', level: 'h2', align: 'center', color: '' };
    const t = createBlock('text');
    t.props = {
      content: 'It has been a while. Here is something special to welcome you back.',
      align: 'center',
      fontSize: 16,
    };
    const b = createBlock('button');
    b.props = { label: 'Claim offer', url: '{{cta_url}}', align: 'center', variant: 'primary' };
    return doc([h, t, b, createBlock('divider'), createBlock('footer')], 'Come back to {{company_name}}');
  })(),
  (() => {
    const h = createBlock('header');
    h.props = { text: 'Monthly newsletter', level: 'h1', align: 'left', color: '' };
    const img = createBlock('image');
    const t1 = createBlock('text');
    t1.props = { content: 'Highlights from this month at {{company_name}}.', align: 'left', fontSize: 16 };
    const cols = createBlock('columns');
    cols.props = { left: 'Product updates', right: 'Customer stories' };
    return doc([h, img, t1, cols, createBlock('button'), createBlock('footer')], '{{company_name}} monthly update');
  })(),
];
