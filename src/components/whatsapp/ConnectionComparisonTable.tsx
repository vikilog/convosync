/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FC } from 'react';
import { CONNECTION_COMPARISON_ROWS } from './connectionComparisonData';

export const ConnectionComparisonTable: FC = () => {
  return (
    <section
      className="w-full rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(25,26,43,0.05),0_8px_24px_rgba(65,44,221,0.05)] overflow-hidden"
      aria-label="Connection options comparison"
    >
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/80">
        <h3 className="text-base font-black text-gray-950">Compare Connection Options</h3>
        <p className="mt-1 text-xs text-gray-500 font-medium">
          A quick side-by-side view to help you pick the right path.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-gray-50/80">
              <th
                scope="col"
                className="px-6 py-4 text-sm font-black uppercase tracking-widest text-gray-400 w-[28%]"
              >
                &nbsp;
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-sm font-black text-primary w-[36%]"
              >
                WhatsApp Business API
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-sm font-black text-[#006d2f] w-[36%]"
              >
                Business App Coexistence
              </th>
            </tr>
          </thead>
          <tbody>
            {CONNECTION_COMPARISON_ROWS.map((row, index) => (
              <tr
                key={row.id}
                className={index < CONNECTION_COMPARISON_ROWS.length - 1 ? 'border-b border-slate-200' : ''}
              >
                <th
                  scope="row"
                  className="px-6 py-4 text-sm font-black text-gray-900 align-top bg-slate-50/40"
                >
                  {row.label}
                </th>
                <td className="px-6 py-4 text-sm font-semibold text-gray-700 align-top">
                  {row.businessApi}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-700 align-top">
                  {row.coexistence}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
