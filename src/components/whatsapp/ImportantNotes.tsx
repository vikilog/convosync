/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FC } from 'react';
import { AlertCircle } from 'lucide-react';
import type { ImportantNote } from './businessApiOnboardingData';

type ImportantNotesProps = {
  notes: ImportantNote[];
};

export const ImportantNotes: FC<ImportantNotesProps> = ({ notes }) => {
  return (
    <section className="space-y-3" aria-label="Important notes">
      {notes.map((note) => (
        <div
          key={note.id}
          className="flex gap-4 p-4 sm:p-5 rounded-2xl border border-[#fff5e6] bg-[#fffbf5] shadow-sm"
        >
          <span className="flex shrink-0 items-center justify-center w-10 h-10 rounded-xl bg-[#fff5e6] text-[#f2994a]">
            <AlertCircle className="w-5 h-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black uppercase tracking-widest text-[#f2994a]">
              Important
            </p>
            <p className="mt-1 text-sm text-gray-800 font-semibold leading-relaxed">
              {note.message}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
};
