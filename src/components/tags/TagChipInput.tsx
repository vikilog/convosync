/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useId, useState } from 'react';
import { X } from 'lucide-react';
import { useWorkspaceTags } from '../../lib/useWorkspaceTags';
import { Input } from '../ui/input';

type Props = {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  /** Tighter padding for narrow node-config sidebars. */
  compact?: boolean;
};

const CHIP = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-primary text-xs font-bold';

/**
 * Chip-style multi-tag editor with folder-clustered suggestions from the WorkspaceTag registry.
 * Typing a name that isn't in the registry yet and pressing Enter/comma still adds it — the
 * backend upserts new WorkspaceTag rows wherever tags get saved (contact save, journeys, etc).
 */
export function TagChipInput({ value, onChange, placeholder = 'Select or create a new tag', compact }: Props) {
  const suggestions = useWorkspaceTags();
  const [input, setInput] = useState('');
  const listId = useId();

  const addTag = (raw: string) => {
    const t = raw.trim();
    if (!t || value.includes(t)) {
      setInput('');
      return;
    }
    onChange([...value, t]);
    setInput('');
  };

  return (
    <div>
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map((t) => (
            <span key={t} className={CHIP}>
              {t}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== t))}
                className="hover:text-red-500"
                aria-label={`Remove ${t}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(input);
          } else if (e.key === 'Backspace' && !input && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => addTag(input)}
        list={listId}
        placeholder={placeholder}
        className={
          compact
            ? 'w-full rounded-lg border border-swiss-line px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20'
            : 'w-full rounded-lg border border-swiss-line px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20'
        }
      />
      <datalist id={listId}>
        {suggestions
          .filter((t) => !value.includes(t))
          .map((t) => (
            <option key={t} value={t} />
          ))}
      </datalist>
    </div>
  );
}
