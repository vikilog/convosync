import type { BrandSettings, EmailBlock, EmailDesignDocument } from './types';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function alignStyle(align: string): string {
  return align === 'center' || align === 'right' ? `text-align:${align};` : 'text-align:left;';
}

function renderBlock(block: EmailBlock, brand: BrandSettings): string {
  const p = block.props;
  const primary = (p.bgColor as string) || brand.primaryColor;
  const textColor = brand.textColor;

  switch (block.type) {
    case 'header': {
      const level = (p.level as string) === 'h2' ? 'h2' : 'h1';
      const size = level === 'h2' ? '20px' : '26px';
      const color = (p.color as string) || textColor;
      return `<tr><td style="padding:16px 24px 8px;${alignStyle(String(p.align ?? 'left'))}"><${level} style="margin:0;font-size:${size};line-height:1.3;color:${color};font-family:${brand.fontFamily};">${String(p.text ?? '')}</${level}></td></tr>`;
    }
    case 'text':
      return `<tr><td style="padding:8px 24px;${alignStyle(String(p.align ?? 'left'))}"><p style="margin:0;font-size:${Number(p.fontSize) || 16}px;line-height:1.65;color:${textColor};font-family:${brand.fontFamily};">${String(p.content ?? '').replace(/\n/g, '<br/>')}</p></td></tr>`;
    case 'image': {
      const src = String(p.src ?? '');
      const alt = esc(String(p.alt ?? ''));
      const width = String(p.width ?? '100%');
      const link = String(p.link ?? '');
      const img = `<img src="${esc(src)}" alt="${alt}" width="${width === '100%' ? '560' : width}" style="max-width:100%;height:auto;display:block;border:0;" />`;
      const inner = link
        ? `<a href="${esc(link)}" style="text-decoration:none;">${img}</a>`
        : img;
      return `<tr><td style="padding:12px 24px;${alignStyle(String(p.align ?? 'center'))}">${inner}</td></tr>`;
    }
    case 'button': {
      const label = String(p.label ?? 'Click');
      const url = String(p.url ?? '#');
      const bg = (p.bgColor as string) || primary;
      const fg = String(p.textColor ?? '#ffffff');
      const radius = Number(p.borderRadius) || 8;
      return `<tr><td style="padding:16px 24px;${alignStyle(String(p.align ?? 'center'))}"><a href="${esc(url)}" style="display:inline-block;background:${bg};color:${fg};text-decoration:none;padding:14px 28px;border-radius:${radius}px;font-weight:600;font-size:15px;font-family:${brand.fontFamily};">${esc(label)}</a></td></tr>`;
    }
    case 'columns':
      return `<tr><td style="padding:12px 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="50%" valign="top" style="padding-right:8px;font-size:15px;line-height:1.6;color:${textColor};font-family:${brand.fontFamily};">${String(p.left ?? '')}</td><td width="50%" valign="top" style="padding-left:8px;font-size:15px;line-height:1.6;color:${textColor};font-family:${brand.fontFamily};">${String(p.right ?? '')}</td></tr></table></td></tr>`;
    case 'divider':
      return `<tr><td style="padding:8px 24px;"><hr style="border:none;border-top:${Number(p.thickness) || 1}px solid ${String(p.color ?? '#e2e8f0')};margin:0;" /></td></tr>`;
    case 'spacer':
      return `<tr><td style="height:${Number(p.height) || 24}px;line-height:${Number(p.height) || 24}px;font-size:1px;">&nbsp;</td></tr>`;
    case 'footer':
      return `<tr><td style="padding:20px 24px;${alignStyle(String(p.align ?? 'center'))}"><p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;font-family:${brand.fontFamily};">${String(p.text ?? '')}</p></td></tr>`;
    case 'html':
      return `<tr><td style="padding:12px 24px;">${String(p.rawHtml ?? '')}</td></tr>`;
    default:
      return '';
  }
}

/** Renders block document to email-client-safe HTML (inner body fragments). */
export function renderBlocksToHtmlBody(blocks: EmailBlock[], brand: BrandSettings): string {
  const rows = blocks.map((b) => renderBlock(b, brand)).join('\n');
  return rows;
}

function isFullHtmlDocument(html: string): boolean {
  const trimmed = html.trim();
  return /<!DOCTYPE\s+html/i.test(trimmed) || /<html[\s>]/i.test(trimmed);
}

export { isFullHtmlDocument };

/** Full email HTML document for sending / preview. */
export function renderDesignToFullHtml(design: EmailDesignDocument): string {
  const { brand, blocks } = design;

  if (blocks.length === 1 && blocks[0].type === 'html') {
    const raw = String(blocks[0].props.rawHtml ?? '').trim();
    if (raw && isFullHtmlDocument(raw)) {
      return raw;
    }
  }

  const logoRow = brand.logoUrl
    ? `<tr><td style="padding:20px 24px 8px;text-align:center;"><img src="${esc(brand.logoUrl)}" alt="${esc(brand.companyName)}" height="36" style="height:36px;width:auto;" /></td></tr>`
    : '';

  const inner = `${logoRow}${renderBlocksToHtmlBody(blocks, brand)}`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${brand.backgroundColor};border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
${inner}
</table>
</td></tr>
</table>
</body>
</html>`;
}
