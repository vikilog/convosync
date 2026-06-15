/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Check, X } from 'lucide-react';
import { PRODUCT_NAME } from '../brand';

interface CompareRow {
  feature: string;
  convosync: string | boolean;
  respond: string | boolean;
  ycloud: string | boolean;
  freshdesk: string | boolean;
}

export default function ComparisonTable() {
  const dataset: CompareRow[] = [
    { feature: 'WhatsApp Business API Service', convosync: true, respond: true, ycloud: true, freshdesk: true },
    { feature: 'Instagram DM Integration', convosync: true, respond: true, ycloud: false, freshdesk: true },
    { feature: 'Telegram Bot Support', convosync: true, respond: true, ycloud: false, freshdesk: false },
    { feature: 'AI Support Agents (Custom Trained)', convosync: true, respond: true, ycloud: true, freshdesk: false },
    { feature: 'Drag & Drop Journey Builder', convosync: true, respond: true, ycloud: true, freshdesk: false },
    { feature: 'Localized India Pricing (INR Options)', convosync: '✅ ₹1,999/mo', respond: '❌ $79/mo (approx ₹6,500)', ycloud: '❌ $15/mo core + paywall', freshdesk: '❌ $15/mo per rep' },
    { feature: 'Hindi & Regional Language Support', convosync: true, respond: false, ycloud: false, freshdesk: false },
    { feature: 'Zero Per-Message Markup Charges', convosync: true, respond: false, ycloud: false, freshdesk: 'N/A' },
    { feature: 'Indian Domestic Customer Support Staff', convosync: true, respond: false, ycloud: false, freshdesk: false },
  ];

  const renderVal = (v: string | boolean, isHighlighted = false) => {
    if (typeof v === 'boolean') {
      return v
        ? <Check className={`w-5 h-5 mx-auto ${isHighlighted ? 'text-emerald-500 font-extrabold scale-110' : 'text-gray-400'}`} />
        : <X className="w-4 h-4 text-rose-400 mx-auto" />;
    }
    return <span className={`text-[11px] block text-center font-semibold ${isHighlighted ? 'text-brand-indigo font-extrabold' : 'text-gray-500'}`}>{v}</span>;
  };

  return (
    <section id="compare" className="bg-[#FAF9FF] border-b border-gray-100 py-24 text-gray-900 text-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase font-extrabold text-brand-indigo tracking-widest font-mono">
            Humble Assessment
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight text-gray-900 mt-2">
            The Honest Competitive Comparison
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-3 font-sans">
            Why growing Indian brands and educational institutes switch to the {PRODUCT_NAME} platform.
          </p>
        </div>

        <div className="max-w-5xl mx-auto bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 font-display text-xs font-bold text-gray-700">
                  <th className="p-5 w-[32%]">Functional Suite Features</th>
                  <th className="p-5 text-center text-brand-indigo font-extrabold bg-indigo-50/50 w-[18%]">{PRODUCT_NAME}</th>
                  <th className="p-5 text-center w-[17%]">Respond.io</th>
                  <th className="p-5 text-center w-[16%]">YCloud</th>
                  <th className="p-5 text-center w-[17%]">Freshdesk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-[12.5px] font-sans">
                {dataset.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-5 font-semibold text-gray-800">{row.feature}</td>
                    <td className="p-5 text-center bg-indigo-50/20 font-bold border-x border-indigo-50/30">
                      {renderVal(row.convosync, true)}
                    </td>
                    <td className="p-5 text-center text-gray-600">{renderVal(row.respond)}</td>
                    <td className="p-5 text-center text-gray-600">{renderVal(row.ycloud)}</td>
                    <td className="p-5 text-center text-gray-600">{renderVal(row.freshdesk)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-[10px] text-gray-400 mt-6 font-mono">
          🔍 All comparison metrics are compiled from respective brand brochures and official pricing directories published in 2026.
        </p>

      </div>
    </section>
  );
}
