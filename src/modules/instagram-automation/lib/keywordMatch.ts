/** Case-insensitive substring match; empty keyword = match any text. */
export function matchesKeyword(text: string, keyword: string | undefined | null): boolean {
  const k = keyword?.trim();
  if (!k) return true;
  return text.toLowerCase().includes(k.toLowerCase());
}
