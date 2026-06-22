export function insertAtCursor(
  textarea: HTMLTextAreaElement | null,
  text: string,
  currentValue: string,
  onChange: (value: string) => void
) {
  if (!textarea) {
    onChange(currentValue ? `${currentValue}\n${text}` : text);
    return;
  }
  const start = textarea.selectionStart ?? currentValue.length;
  const end = textarea.selectionEnd ?? currentValue.length;
  const next = currentValue.slice(0, start) + text + currentValue.slice(end);
  onChange(next);
  requestAnimationFrame(() => {
    const pos = start + text.length;
    textarea.focus();
    textarea.setSelectionRange(pos, pos);
  });
}
