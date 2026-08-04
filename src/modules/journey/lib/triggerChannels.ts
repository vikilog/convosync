/** Replace common journey variables with sample values for preview. */
export function sampleMessagePreview(text: string): string {
  return text
    .replace(/\{\{\s*contact\.name\s*\}\}/gi, 'Alex')
    .replace(/\{\{\s*contact\.phone\s*\}\}/gi, '+91 98765 43210')
    .replace(/\{\{\s*contact\.email\s*\}\}/gi, 'alex@example.com')
    .replace(/\{\{\s*1\s*\}\}/g, 'Alex')
    .replace(/\{\{\s*2\s*\}\}/g, 'sample')
    .trim();
}
