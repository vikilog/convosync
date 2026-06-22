export type BlockType =
  | 'header'
  | 'text'
  | 'image'
  | 'button'
  | 'divider'
  | 'spacer'
  | 'columns'
  | 'footer'
  | 'html';

export type TextAlign = 'left' | 'center' | 'right';

export type BrandSettings = {
  primaryColor: string;
  textColor: string;
  backgroundColor: string;
  fontFamily: string;
  logoUrl: string;
  companyName: string;
};

export type EmailBlock = {
  id: string;
  type: BlockType;
  props: Record<string, unknown>;
};

export type EmailDesignDocument = {
  version: 1;
  blocks: EmailBlock[];
  brand: BrandSettings;
};

export type LeftPanelTab = 'blocks' | 'gallery' | 'sections' | 'variables' | 'brand';

export const DEFAULT_BRAND: BrandSettings = {
  primaryColor: '#0284c7',
  textColor: '#1c1e21',
  backgroundColor: '#ffffff',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  logoUrl: '',
  companyName: 'Your Company',
};

export type BlockDefinition = {
  type: BlockType;
  label: string;
  description: string;
  icon: string;
  defaultProps: Record<string, unknown>;
};
