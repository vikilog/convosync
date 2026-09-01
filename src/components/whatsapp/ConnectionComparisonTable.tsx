/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FC } from 'react';
import { CONNECTION_COMPARISON_ROWS } from './connectionComparisonData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export const ConnectionComparisonTable: FC = () => {
  return (
    <section
      className="w-full rounded-2xl border border-swiss-line bg-white shadow-[0_1px_3px_rgba(25,26,43,0.05),0_8px_24px_rgba(65,44,221,0.05)] overflow-hidden"
      aria-label="Connection options comparison"
    >
      <div className="px-6 py-5 border-b border-swiss-line bg-slate-50/80">
        <h3 className="text-base font-semibold text-gray-950">Compare Connection Options</h3>
        <p className="mt-1 text-xs text-swiss-muted font-medium">
          A quick side-by-side view to help you pick the right path.
        </p>
      </div>

      <Table className="min-w-[640px] text-left border-collapse">
          <TableHeader>
            <TableRow className="border-b border-swiss-line bg-gray-50/80">
              <TableHead
                scope="col"
                className="px-6 py-4 text-sm font-black uppercase tracking-widest text-swiss-faint w-[28%] whitespace-normal"
              >
                &nbsp;
              </TableHead>
              <TableHead
                scope="col"
                className="px-6 py-4 text-sm font-black text-primary w-[36%] whitespace-normal"
              >
                WhatsApp Business API
              </TableHead>
              <TableHead
                scope="col"
                className="px-6 py-4 text-sm font-black text-[#006d2f] w-[36%] whitespace-normal"
              >
                Business App Coexistence
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CONNECTION_COMPARISON_ROWS.map((row, index) => (
              <TableRow
                key={row.id}
                className={index < CONNECTION_COMPARISON_ROWS.length - 1 ? 'border-b border-swiss-line' : ''}
              >
                <TableHead
                  scope="row"
                  className="px-6 py-4 text-sm font-black text-swiss-ink align-top bg-slate-50/40 whitespace-normal"
                >
                  {row.label}
                </TableHead>
                <TableCell className="px-6 py-4 text-sm font-semibold text-swiss-ink align-top whitespace-normal">
                  {row.businessApi}
                </TableCell>
                <TableCell className="px-6 py-4 text-sm font-semibold text-swiss-ink align-top whitespace-normal">
                  {row.coexistence}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
      </Table>
    </section>
  );
};
