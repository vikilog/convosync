/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { renderBodyWithSamples } from './templateBuilderUtils';

type Props = {
  headerFormat: 'none' | 'text';
  header: string;
  body: string;
  footer: string;
  variableSamples: string[];
  buttonType: '' | 'QUICK_REPLY' | 'URL';
  buttonText: string;
  languageLabel?: string;
  category?: string;
  templateName?: string;
};

export const WhatsAppTemplatePreview: React.FC<Props> = ({
  headerFormat,
  header,
  body,
  footer,
  variableSamples,
  buttonType,
  buttonText,
  languageLabel = 'English',
  category,
  templateName,
}) => {
  const bodyRendered = renderBodyWithSamples(
    body || 'Your message will appear here.',
    variableSamples
  );
  const showHeader = headerFormat === 'text' && header.trim();

  return (
    <div className="flex flex-col h-full w-full max-w-[420px] mx-auto">
      <div className="mb-4 w-full">
        <p className="text-sm font-semibold text-[#3b4a54]">Template preview</p>
        <p className="text-meta text-[#667781] mt-0.5">
          {category && <span className="font-medium">{category}</span>}
          {category && templateName ? ' · ' : ''}
          {templateName ? (
            <span className="font-mono">{templateName}</span>
          ) : (
            <span className="italic">name not set</span>
          )}
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center w-full min-h-0 py-2">
        <div className="w-full max-w-[340px] rounded-[2.25rem] border-[11px] border-[#1f2c34] bg-[#1f2c34] shadow-2xl overflow-hidden">
          <div className="bg-[#008069] px-4 py-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
              B
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">Business</p>
              <p className="text-meta text-white/85">WhatsApp Business</p>
            </div>
          </div>

          <div
            className="min-h-[480px] px-4 py-5 space-y-3"
            style={{
              backgroundColor: '#efeae2',
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d9d0c3\' fill-opacity=\'0.35\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }}
          >
            <div className="flex justify-center">
              <span className="text-xs text-[#54656f] bg-white/90 px-2.5 py-1 rounded-md shadow-sm">
                Today
              </span>
            </div>

            <div className="flex justify-start">
              <div className="max-w-[95%] bg-white rounded-lg rounded-tl-sm shadow-md overflow-hidden text-[#111b21]">
                {showHeader && (
                  <p className="px-3.5 pt-3 text-base font-semibold leading-snug">{header}</p>
                )}
                <p className="px-3.5 py-2.5 text-sm leading-[1.4] whitespace-pre-wrap break-words">
                  {bodyRendered}
                </p>
                {footer.trim() && (
                  <p className="px-3.5 pb-2 text-meta text-[#667781]">{footer}</p>
                )}
                <div className="px-3.5 pb-2 flex justify-end">
                  <span className="text-xs text-[#667781]">12:00</span>
                </div>

                {buttonText.trim() && buttonType && (
                  <div className="border-t border-[#e9edef]">
                    <button
                      type="button"
                      className="w-full py-3 text-sm font-medium text-[#008069] flex items-center justify-center gap-2 hover:bg-[#f5f6f6]"
                    >
                      {buttonType === 'URL' && (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M14 3h7v7h-2V8.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3zM5 5h6v2H7v10h10v-4h2v6H5V5z" />
                        </svg>
                      )}
                      {buttonText}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-meta text-[#54656f] mt-4 text-center leading-relaxed">
        Preview uses your sample variable values. Language:{' '}
        <span className="font-semibold">{languageLabel}</span>
      </p>
    </div>
  );
};
