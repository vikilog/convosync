/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FileText, Image as ImageIcon, Phone, Video } from 'lucide-react';
import { renderBodyWithSamples, type HeaderFormat, type ButtonKind } from './templateBuilderUtils';

const CHAT_BG_STYLE: React.CSSProperties = {
  backgroundColor: '#efeae2',
  backgroundImage:
    'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d9d0c3\' fill-opacity=\'0.35\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
};

type Props = {
  headerFormat: HeaderFormat;
  header: string;
  headerMediaPreviewUrl?: string;
  headerMediaFileName?: string;
  body: string;
  footer: string;
  variableSamples: string[];
  buttonType: '' | ButtonKind;
  buttonText: string;
  languageLabel?: string;
  category?: string;
  templateName?: string;
  /** List cards: chat bubble only (no phone chrome). */
  compact?: boolean;
};

function MessageBubble({
  headerFormat,
  header,
  headerMediaPreviewUrl,
  headerMediaFileName,
  bodyRendered,
  footer,
  buttonType,
  buttonText,
  compact,
}: {
  headerFormat: HeaderFormat;
  header: string;
  headerMediaPreviewUrl?: string;
  headerMediaFileName?: string;
  bodyRendered: string;
  footer: string;
  buttonType: '' | ButtonKind;
  buttonText: string;
  compact?: boolean;
}) {
  const showTextHeader = headerFormat === 'text' && header.trim();
  const showMediaHeader =
    headerFormat === 'image' || headerFormat === 'video' || headerFormat === 'document';
  const mediaMax = compact ? 'max-h-[120px]' : 'max-h-[180px]';
  const mediaPad = compact ? 'py-5 px-3' : 'py-8 px-4';

  return (
    <div className="max-w-[95%] bg-white rounded-lg rounded-tl-sm shadow-md overflow-hidden text-[#111b21]">
      {showMediaHeader && (
        <div className="bg-[#f0f2f5] border-b border-[#e9edef]">
          {headerFormat === 'image' && headerMediaPreviewUrl ? (
            <img
              src={headerMediaPreviewUrl}
              alt="Header"
              className={`w-full ${mediaMax} object-cover`}
            />
          ) : headerFormat === 'video' && headerMediaPreviewUrl ? (
            <video
              src={headerMediaPreviewUrl}
              className={`w-full ${mediaMax} object-cover bg-black`}
              controls={!compact}
              muted
            />
          ) : (
            <div
              className={`flex flex-col items-center justify-center gap-2 ${mediaPad} text-[#667781]`}
            >
              {headerFormat === 'video' ? (
                <Video className={compact ? 'w-7 h-7 opacity-60' : 'w-10 h-10 opacity-60'} />
              ) : headerFormat === 'document' ? (
                <FileText className={compact ? 'w-7 h-7 opacity-60' : 'w-10 h-10 opacity-60'} />
              ) : (
                <ImageIcon className={compact ? 'w-7 h-7 opacity-60' : 'w-10 h-10 opacity-60'} />
              )}
              <p className="text-xs text-center truncate max-w-full">
                {headerMediaFileName ||
                  (headerFormat === 'video'
                    ? 'Video header'
                    : headerFormat === 'document'
                      ? 'Document header'
                      : 'Image header')}
              </p>
            </div>
          )}
        </div>
      )}

      {showTextHeader && (
        <p
          className={`px-3.5 pt-3 font-semibold leading-snug ${compact ? 'text-sm' : 'text-base'}`}
        >
          {header}
        </p>
      )}

      <p
        className={`px-3.5 py-2.5 leading-[1.4] whitespace-pre-wrap break-words ${
          compact ? 'text-xs line-clamp-6' : 'text-sm'
        }`}
      >
        {bodyRendered}
      </p>
      {footer.trim() && (
        <p className="px-3.5 pb-2 text-meta text-[#667781]">{footer}</p>
      )}
      <div className="px-3.5 pb-2 flex justify-end">
        <span className="text-xs text-[#667781]">12:00</span>
      </div>

      {buttonText.trim() && buttonType && buttonType !== 'none' && (
        <div className="border-t border-[#e9edef]">
          <button
            type="button"
            tabIndex={-1}
            className={`w-full font-medium text-[#008069] flex items-center justify-center gap-2 hover:bg-[#f5f6f6] ${
              compact ? 'py-2.5 text-xs' : 'py-3 text-sm'
            }`}
          >
            {buttonType === 'URL' && (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M14 3h7v7h-2V8.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3zM5 5h6v2H7v10h10v-4h2v6H5V5z" />
              </svg>
            )}
            {buttonType === 'PHONE_NUMBER' && <Phone className="w-4 h-4" />}
            {buttonText}
          </button>
        </div>
      )}
    </div>
  );
}

export const WhatsAppTemplatePreview: React.FC<Props> = ({
  headerFormat,
  header,
  headerMediaPreviewUrl,
  headerMediaFileName,
  body,
  footer,
  variableSamples,
  buttonType,
  buttonText,
  languageLabel = 'English',
  category,
  templateName,
  compact = false,
}) => {
  const bodyRendered = renderBodyWithSamples(
    body || 'Your message will appear here.',
    variableSamples
  );

  const bubble = (
    <MessageBubble
      headerFormat={headerFormat}
      header={header}
      headerMediaPreviewUrl={headerMediaPreviewUrl}
      headerMediaFileName={headerMediaFileName}
      bodyRendered={bodyRendered}
      footer={footer}
      buttonType={buttonType}
      buttonText={buttonText}
      compact={compact}
    />
  );

  if (compact) {
    return (
      <div className="rounded-lg overflow-hidden" style={CHAT_BG_STYLE}>
        <div className="px-2 py-2 space-y-1.5">
          <div className="flex justify-center">
            <span className="text-[10px] text-[#54656f] bg-white/90 px-2 py-0.5 rounded-md shadow-sm">
              Today
            </span>
          </div>
          <div className="flex justify-start">{bubble}</div>
        </div>
      </div>
    );
  }

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

          <div className="min-h-[480px] px-4 py-5 space-y-3" style={CHAT_BG_STYLE}>
            <div className="flex justify-center">
              <span className="text-xs text-[#54656f] bg-white/90 px-2.5 py-1 rounded-md shadow-sm">
                Today
              </span>
            </div>

            <div className="flex justify-start">{bubble}</div>
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
