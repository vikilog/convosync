import { DEFAULT_BRAND, type EmailDesignDocument, type EmailBlock } from './types';
import { createBlockId } from './blockRegistry';

export function designFromApi(
  designJson: unknown,
  htmlBody: string
): EmailDesignDocument {
  if (designJson && typeof designJson === 'object') {
    const doc = designJson as Partial<EmailDesignDocument>;
    if (doc.version === 1 && Array.isArray(doc.blocks)) {
      return {
        version: 1,
        blocks: doc.blocks as EmailBlock[],
        brand: { ...DEFAULT_BRAND, ...(doc.brand ?? {}) },
      };
    }
  }

  return {
    version: 1,
    blocks: [
      {
        id: createBlockId(),
        type: 'html',
        props: { rawHtml: htmlBody },
      },
    ],
    brand: { ...DEFAULT_BRAND },
  };
}

export function designToJson(design: EmailDesignDocument): Record<string, unknown> {
  return {
    version: design.version,
    blocks: design.blocks,
    brand: design.brand,
  };
}
