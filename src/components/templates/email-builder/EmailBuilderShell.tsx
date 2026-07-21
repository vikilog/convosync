/**
 * Block-based email template builder — Mailchimp-style canvas editor.
 * @license SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Code2,
  Eye,
  Loader2,
  Pencil,
  Save,
} from 'lucide-react';
import { api } from '../../../lib/api';
import { useSidebarOffset } from '../../../contexts/SidebarContext';
import type { EmailTemplateRecord } from '../../../types';
import {
  extractEmailTemplateVariables,
  stripHtmlToText,
} from '../emailTemplateUtils';
import { BuilderCanvas } from './BuilderCanvas';
import { LeftSidebar } from './LeftSidebar';
import { PreviewPane } from './PreviewPane';
import { HtmlCodePanel } from './HtmlCodePanel';
import { PropertyPanel } from './PropertyPanel';
import { PreviewVariablesPanel } from './PreviewVariablesPanel';
import { designFromApi, designToJson } from './parseDesign';
import { renderDesignToFullHtml } from './renderHtml';
import { useEmailBuilderStore } from './store';

type Props = {
  template: EmailTemplateRecord | null;
  onBack: () => void;
  onSaved: (savedId?: string) => void;
};

type ViewMode = 'edit' | 'preview' | 'html';

export function EmailBuilderShell({ template, onBack, onSaved }: Props) {
  const initDesign = useEmailBuilderStore((s) => s.initDesign);
  const setMeta = useEmailBuilderStore((s) => s.setMeta);
  const name = useEmailBuilderStore((s) => s.name);
  const subject = useEmailBuilderStore((s) => s.subject);
  const status = useEmailBuilderStore((s) => s.status);
  const blocks = useEmailBuilderStore((s) => s.blocks);
  const brand = useEmailBuilderStore((s) => s.brand);

  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const design = designFromApi(template?.designJson, template?.htmlBody ?? '');
    initDesign(design, {
      name: template?.name ?? '',
      subject: template?.subject ?? 'Welcome to {{company_name}}',
      status: template?.status ?? 'draft',
    });
  }, [template, initDesign]);

  const buildPayload = (publish: boolean) => {
    const design = { version: 1 as const, blocks, brand };
    const htmlBody = renderDesignToFullHtml(design);
    const variables = extractEmailTemplateVariables(subject, htmlBody);
    return {
      name: name.trim() || 'Untitled email',
      subject: subject.trim(),
      htmlBody,
      textBody: stripHtmlToText(htmlBody),
      variables,
      designJson: designToJson(design),
      status: (publish ? 'active' : status) as 'draft' | 'active',
    };
  };

  const handleSave = async (publish: boolean) => {
    setError('');
    if (!subject.trim()) {
      setError('Subject line is required.');
      return;
    }
    if (blocks.length === 0) {
      setError('Add at least one block to your email.');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload(publish);
      if (template?.id) {
        await api.updateEmailTemplate(template.id, payload);
        onSaved(template.id);
      } else {
        const created = (await api.createEmailTemplate({
          ...payload,
          status: publish ? 'active' : 'draft',
        })) as { id?: string };
        onSaved(created?.id ? String(created.id) : undefined);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const sidebarOffset = useSidebarOffset();

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#f0f2f5] min-h-0 transition-[left] duration-200 ease-out"
      style={{ left: sidebarOffset }}
    >
      <header className="shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-[#f4f5f7] text-gray-600"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Template name"
            value={name}
            onChange={(e) => setMeta({ name: e.target.value })}
          />
          <input
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Subject line — use {{variables}}"
            value={subject}
            onChange={(e) => setMeta({ subject: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex rounded-lg border border-slate-200 p-0.5 bg-[#f4f5f7]">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm font-semibold ${
                viewMode === 'edit' ? 'bg-white shadow text-primary' : 'text-gray-500'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              type="button"
              onClick={() => setViewMode('html')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm font-semibold ${
                viewMode === 'html' ? 'bg-white shadow text-primary' : 'text-gray-500'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" /> HTML
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm font-semibold ${
                viewMode === 'preview' ? 'bg-white shadow text-primary' : 'text-gray-500'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(false)}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-gray-700 hover:bg-[#f4f5f7] disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary hover:bg-primary-hover text-white text-sm font-bold disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Publish
          </button>
        </div>
      </header>

      {error ? (
        <div className="shrink-0 mx-4 mt-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
          {error}
        </div>
      ) : null}

      <div className="flex-1 flex min-h-0 min-w-0">
        {viewMode !== 'preview' ? (
          <LeftSidebar />
        ) : null}

        {viewMode === 'edit' ? <BuilderCanvas /> : null}
        {viewMode === 'html' ? <HtmlCodePanel /> : null}
        {viewMode === 'preview' ? <PreviewPane /> : null}

        {viewMode === 'edit' ? <PropertyPanel /> : null}
        {viewMode === 'html' ? <PropertyPanel /> : null}
        {viewMode === 'preview' ? <PreviewVariablesPanel /> : null}
      </div>
    </div>
  );
}
