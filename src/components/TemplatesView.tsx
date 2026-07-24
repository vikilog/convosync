/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useKeepAliveActivation } from './KeepAlive';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Send, Loader2, Mail, MessageCircle, MessageSquareText, RefreshCw } from 'lucide-react';
import { CampaignTemplate, EmailTemplateRecord } from '../types';
import { api } from '../lib/api';
import { mapTemplateFromApi } from '../lib/mappers';
import {
  pathForTemplateEditor,
  pathForTemplatesList,
  templateEditorFromPath,
  type TemplateChannel,
} from '../routes';
import { WhatsAppTemplateBuilder } from './templates/WhatsAppTemplateBuilder';
import { EmailTemplateBuilder } from './templates/EmailTemplateBuilder';
import { WhatsAppTemplatePreview } from './templates/WhatsAppTemplatePreview';
import { TemplateStatusBadge } from './templates/TemplateStatusBadge';
import {
  TEMPLATE_CATEGORIES,
  CATEGORY_BADGE_CLASS,
  statusUiToSlug,
} from '../lib/templateLabels';
import { stripHtmlToText, wrapPreviewHtml, applyEmailTemplateVariables, buildSampleVariables } from './templates/emailTemplateUtils';
import { headerFormatFromApi, type ButtonKind } from './templates/templateBuilderUtils';
import {
  mapCannedResponseFromApi,
  type CannedResponseRecord,
} from './templates/CannedResponseModal';
import { CannedResponsesPanel } from './templates/CannedResponsesPanel';

function waButtonKind(raw?: string): '' | ButtonKind {
  if (raw === 'URL' || raw === 'QUICK_REPLY' || raw === 'PHONE_NUMBER') return raw;
  return '';
}

type Channel = TemplateChannel;

function mapEmailTemplateFromApi(row: Record<string, unknown>): EmailTemplateRecord {
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    subject: String(row.subject ?? ''),
    htmlBody: String(row.htmlBody ?? ''),
    textBody: row.textBody != null ? String(row.textBody) : null,
    designJson:
      row.designJson && typeof row.designJson === 'object'
        ? (row.designJson as Record<string, unknown>)
        : null,
    variables: Array.isArray(row.variables) ? row.variables.map(String) : [],
    status: row.status === 'active' ? 'active' : 'draft',
    createdAt: row.createdAt ? String(row.createdAt) : undefined,
    updatedAt: row.updatedAt ? String(row.updatedAt) : undefined,
  };
}

function formatUpdated(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

export const TemplatesView: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const editorRoute = useMemo(
    () => templateEditorFromPath(location.pathname),
    [location.pathname]
  );

  const channel: Channel = editorRoute.channel ?? 'whatsapp';
  const isBuilder = editorRoute.mode === 'new' || editorRoute.mode === 'edit';

  const [waTemplates, setWaTemplates] = useState<CampaignTemplate[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplateRecord[]>([]);
  const [cannedResponses, setCannedResponses] = useState<CannedResponseRecord[]>([]);
  const [cannedSaving, setCannedSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editorLoading, setEditorLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [editingWa, setEditingWa] = useState<CampaignTemplate | null>(null);
  const [editingEmail, setEditingEmail] = useState<EmailTemplateRecord | null>(null);
  const [actionError, setActionError] = useState('');

  const loadWhatsApp = useCallback(async () => {
    const raw = await api.getTemplates();
    const list = (raw ?? []) as Record<string, unknown>[];
    setWaTemplates(list.map((t) => mapTemplateFromApi(t)));
  }, []);

  const loadEmail = useCallback(async () => {
    const raw = (await api.getEmailTemplates()) as Record<string, unknown>[];
    setEmailTemplates((raw ?? []).map(mapEmailTemplateFromApi));
  }, []);

  const loadCanned = useCallback(async () => {
    const raw = (await api.getCannedResponses()) as Record<string, unknown>[];
    setCannedResponses((raw ?? []).map(mapCannedResponseFromApi));
  }, []);

  const isBuilderRef = useRef(isBuilder);
  isBuilderRef.current = isBuilder;

  const loadAll = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) setLoading(true);
      if (!options?.silent) setActionError('');
      try {
        await Promise.all([loadWhatsApp(), loadEmail(), loadCanned()]);
      } catch (err) {
        if (!options?.silent) {
          setActionError(err instanceof Error ? err.message : 'Failed to load templates');
        }
      } finally {
        if (!options?.silent) setLoading(false);
      }
    },
    [loadWhatsApp, loadEmail, loadCanned]
  );

  useEffect(() => {
    if (!isBuilder) void loadAll();
  }, [loadAll, isBuilder]);

  useKeepAliveActivation(() => {
    if (!isBuilderRef.current) void loadAll({ silent: true });
  });

  useEffect(() => {
    if (!isBuilder || editorRoute.channel !== 'email') {
      setEditingEmail(null);
      return;
    }
    if (editorRoute.mode === 'new') {
      setEditingEmail(null);
      return;
    }
    if (!editorRoute.id) return;

    const cached = emailTemplates.find((t) => t.id === editorRoute.id);
    if (cached) {
      setEditingEmail(cached);
      return;
    }

    let cancelled = false;
    setEditorLoading(true);
    setActionError('');
    void api
      .getEmailTemplate(editorRoute.id)
      .then((row) => {
        if (cancelled) return;
        setEditingEmail(mapEmailTemplateFromApi(row as Record<string, unknown>));
      })
      .catch((err) => {
        if (cancelled) return;
        setActionError(err instanceof Error ? err.message : 'Template not found');
        navigate(pathForTemplatesList('email'), { replace: true });
      })
      .finally(() => {
        if (!cancelled) setEditorLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isBuilder, editorRoute, emailTemplates, navigate]);

  useEffect(() => {
    if (!isBuilder || editorRoute.channel !== 'whatsapp') {
      setEditingWa(null);
      return;
    }
    if (editorRoute.mode === 'new') {
      setEditingWa(null);
      return;
    }
    if (!editorRoute.id) return;

    const cached = waTemplates.find((t) => t.id === editorRoute.id);
    if (cached) {
      setEditingWa(cached);
      return;
    }

    let cancelled = false;
    setEditorLoading(true);
    setActionError('');
    void api
      .getTemplate(editorRoute.id)
      .then((row) => {
        if (cancelled) return;
        setEditingWa(mapTemplateFromApi(row as Record<string, unknown>));
      })
      .catch((err) => {
        if (cancelled) return;
        setActionError(err instanceof Error ? err.message : 'Template not found');
        navigate(pathForTemplatesList('whatsapp'), { replace: true });
      })
      .finally(() => {
        if (!cancelled) setEditorLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isBuilder, editorRoute, waTemplates, navigate]);

  const openWaBuilder = (template: CampaignTemplate | null) => {
    navigate(pathForTemplateEditor('whatsapp', template?.id ?? null));
  };

  const openEmailBuilder = (template: EmailTemplateRecord | null) => {
    navigate(pathForTemplateEditor('email', template?.id ?? null));
  };

  const closeBuilder = () => {
    navigate(pathForTemplatesList(channel));
    void loadAll();
  };

  const handleEmailSaved = (savedId?: string) => {
    void loadEmail();
    if (savedId && editorRoute.mode === 'new') {
      navigate(pathForTemplateEditor('email', savedId), { replace: true });
    }
  };

  if (isBuilder && editorRoute.channel === 'email') {
    if (editorLoading && editorRoute.mode === 'edit') {
      return (
        <div className="flex justify-center py-24 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      );
    }
    return (
      <EmailTemplateBuilder
        template={editingEmail}
        onBack={closeBuilder}
        onSaved={handleEmailSaved}
      />
    );
  }

  if (isBuilder && editorRoute.channel === 'whatsapp') {
    if (editorLoading && editorRoute.mode === 'edit') {
      return (
        <div className="flex justify-center py-24 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      );
    }
    return (
      <WhatsAppTemplateBuilder
        template={editingWa}
        onBack={closeBuilder}
        onSaved={() => void loadWhatsApp()}
      />
    );
  }

  const handleDeleteWa = async (t: CampaignTemplate) => {
    if (!t.id) return;
    if (!window.confirm(`Delete template "${t.name}" from Meta and this workspace?`)) return;
    try {
      await api.deleteTemplate(t.id);
      await loadWhatsApp();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleSubmitWa = async (t: CampaignTemplate) => {
    if (!t.id) return;
    try {
      await api.submitTemplate(t.id);
      await loadWhatsApp();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Submit failed');
    }
  };

  const handleRefreshWaStatus = async (t: CampaignTemplate) => {
    if (!t.id) return;
    try {
      const res = (await api.refreshTemplateStatus(t.id)) as {
        message?: string;
        metaFound?: boolean;
      };
      await loadWhatsApp();
      if (res.metaFound === false && res.message) {
        setActionError(res.message);
      } else {
        setActionError('');
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Status refresh failed');
    }
  };

  const handleDeleteEmail = async (t: EmailTemplateRecord) => {
    if (!t.id) return;
    if (!window.confirm(`Delete email template "${t.name}"?`)) return;
    try {
      await api.deleteEmailTemplate(t.id);
      await loadEmail();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleDeleteCanned = async (item: CannedResponseRecord) => {
    try {
      await api.deleteCannedResponse(item.id);
      await loadCanned();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Delete failed');
      throw err;
    }
  };

  const handleSaveCanned = async (
    id: string | null,
    payload: { title: string; content: string; shortcut?: string | null },
    media?: { file?: File | null; removeMedia?: boolean }
  ): Promise<string | void> => {
    setCannedSaving(true);
    setActionError('');
    try {
      const saved = (await api.saveCannedResponse(id, payload, media)) as Record<string, unknown>;
      await loadCanned();
      return saved?.id ? String(saved.id) : undefined;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Save failed');
      throw err;
    } finally {
      setCannedSaving(false);
    }
  };

  const q = search.toLowerCase();

  const filteredWa = waTemplates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(q) || t.bodyPattern.toLowerCase().includes(q);
    const matchesCat = categoryFilter === 'All' || t.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const filteredEmail = emailTemplates.filter((t) => {
    const plain = stripHtmlToText(t.htmlBody);
    return (
      t.name.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      plain.toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    if (channel === 'email') openEmailBuilder(null);
    else openWaBuilder(null);
  };

  return (
    <div className="space-y-4 animate-scale-up">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => navigate(pathForTemplatesList('whatsapp'))}
          className={`px-3 py-2 rounded-xl text-sm font-bold border inline-flex items-center gap-1.5 ${
            channel === 'whatsapp'
              ? 'bg-[#008069] text-white border-[#008069]'
              : 'bg-surface text-gray-700 border-black/5'
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          WhatsApp
        </button>
        <button
          type="button"
          onClick={() => navigate(pathForTemplatesList('email'))}
          className={`px-3 py-2 rounded-xl text-sm font-bold border inline-flex items-center gap-1.5 ${
            channel === 'email'
              ? 'bg-primary text-white border-primary'
              : 'bg-surface text-gray-700 border-black/5'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          Email
        </button>
        <button
          type="button"
          onClick={() => navigate(pathForTemplatesList('canned'))}
          className={`px-3 py-2 rounded-xl text-sm font-bold border inline-flex items-center gap-1.5 ${
            channel === 'canned'
              ? 'bg-primary text-white border-primary'
              : 'bg-surface text-gray-700 border-black/5'
          }`}
        >
          <MessageSquareText className="w-3.5 h-3.5" />
          Canned response
        </button>
      </div>

      {channel === 'canned' ? (
        <CannedResponsesPanel
          items={cannedResponses}
          loading={loading}
          saving={cannedSaving}
          error={actionError || undefined}
          onSave={handleSaveCanned}
          onDelete={handleDeleteCanned}
        />
      ) : (
        <>
      <div className="p-4 bg-surface border border-black/5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          {channel === 'whatsapp' && (
            <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-meta font-bold text-gray-400 mr-1">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent border-none text-meta font-bold text-gray-800 outline-none p-0 cursor-pointer"
              >
                <option value="All">All</option>
                {TEMPLATE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="relative w-48 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-9 pr-3 text-meta font-semibold outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openCreate}
            className={`px-3 py-2 text-white rounded-xl text-meta font-bold flex items-center gap-1.5 shadow-sm ${
              channel === 'email'
                ? 'bg-primary hover:bg-primary-hover'
                : 'bg-[#008069] hover:bg-[#006e5b]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Create template
          </button>
        </div>
      </div>

      {actionError && (
        <p className="text-sm font-bold text-red-500 bg-red-50 border border-red-100 rounded-xl p-3">
          {actionError}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : channel === 'whatsapp' ? (
        filteredWa.length === 0 ? (
          <EmptyState channel="whatsapp" onCreate={openCreate} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredWa.map((template) => (
              <WhatsAppCard
                key={template.id ?? template.name}
                template={template}
                onOpen={() => openWaBuilder(template)}
                onEdit={() => openWaBuilder(template)}
                onSubmit={() => void handleSubmitWa(template)}
                onRefreshStatus={() => handleRefreshWaStatus(template)}
                onDelete={() => void handleDeleteWa(template)}
              />
            ))}
          </div>
        )
      ) : filteredEmail.length === 0 ? (
        <EmptyState channel="email" onCreate={openCreate} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredEmail.map((template) => (
            <EmailCard
              key={template.id ?? template.name}
              template={template}
              onOpen={() => openEmailBuilder(template)}
              onEdit={() => openEmailBuilder(template)}
              onDelete={() => void handleDeleteEmail(template)}
            />
          ))}
        </div>
      )}

        </>
      )}
    </div>
  );
};

function EmptyState({ channel, onCreate }: { channel: Channel; onCreate: () => void }) {
  const label =
    channel === 'whatsapp' ? 'WhatsApp' : channel === 'email' ? 'email' : 'canned response';
  return (
    <div className="bg-surface border border-dashed border-black/10 rounded-2xl p-12 text-center">
      <p className="text-sm font-bold text-gray-600">No {label} templates</p>
      <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
        {channel === 'whatsapp'
          ? 'Create WhatsApp message templates with live preview — same flow as Meta Business Suite.'
          : channel === 'email'
            ? 'Build reusable email templates with a visual editor and HTML code, plus live preview.'
            : 'Save quick replies your team can insert while chatting with customers in Inbox.'}
      </p>
      <button
        type="button"
        onClick={onCreate}
        className={`mt-4 px-4 py-2 text-white rounded-xl text-sm font-bold ${
          channel === 'email' || channel === 'canned'
            ? 'bg-primary hover:bg-primary-hover'
            : 'bg-[#008069]'
        }`}
      >
        {channel === 'canned' ? 'Add canned response' : 'Create template'}
      </button>
    </div>
  );
}

function WhatsAppCard({
  template,
  onOpen,
  onEdit,
  onSubmit,
  onRefreshStatus,
  onDelete,
}: {
  template: CampaignTemplate;
  onOpen: () => void;
  onEdit: () => void;
  onSubmit: () => void;
  onRefreshStatus: () => Promise<void>;
  onDelete: () => void;
}) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setRefreshing(true);
    try {
      await onRefreshStatus();
    } finally {
      setRefreshing(false);
    }
  };

  const headerFormat = headerFormatFromApi(template.headerFormat, Boolean(template.header?.trim()));
  const headerMediaPreviewUrl = template.headerMediaStorageKey
    ? api.templateHeaderMediaUrl(template.headerMediaStorageKey)
    : undefined;

  return (
    <div
      className="bg-surface border border-black/5 rounded-xl p-3 flex flex-col text-left hover:border-[#008069]/30 transition-all cursor-pointer"
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-1.5 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`${CATEGORY_BADGE_CLASS} !text-[10px] !px-1.5 !py-0.5`}>{template.category}</span>
          <h5 className="font-bold text-gray-900 text-xs truncate font-mono">{template.name}</h5>
        </div>
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {template.id ? (
            <button
              type="button"
              title="Refresh status from Meta"
              onClick={(e) => void handleRefresh(e)}
              disabled={refreshing}
              className="p-1 rounded-md hover:bg-surface-muted text-slate-500 hover:text-primary disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          ) : null}
          <TemplateStatusBadge status={statusUiToSlug(template.status)} />
        </div>
      </div>
      {template.status === 'Draft' && (
        <p className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-2 py-1 mb-2">
          Not in Meta yet — open template and click Submit, or use the send icon below.
        </p>
      )}
      {template.status === 'Rejected' && template.rejectionReason && (
        <p className="text-[11px] text-red-700 bg-red-50 border border-red-100 rounded-md px-2 py-1 mb-2 line-clamp-2">
          Meta rejected: {template.rejectionReason}
        </p>
      )}
      <div className="flex-1 min-h-0 pointer-events-none">
        <WhatsAppTemplatePreview
          compact
          headerFormat={headerFormat}
          header={template.header ?? ''}
          headerMediaPreviewUrl={headerMediaPreviewUrl}
          headerMediaFileName={template.headerMediaFileName}
          body={template.bodyPattern}
          footer={template.footer ?? ''}
          variableSamples={template.variables}
          buttonType={waButtonKind(template.buttonType)}
          buttonText={template.buttonText ?? template.buttons[0] ?? ''}
        />
      </div>
      <div
        className="pt-2 border-t border-gray-50 mt-2.5 flex flex-wrap justify-between items-center gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs font-bold text-gray-400">{template.lastUpdated}</span>
        <div className="flex gap-1">
          {template.status !== 'Approved' && template.id && (
            <>
              <button type="button" title="Edit" onClick={onEdit} className="p-1 rounded-md hover:bg-gray-100 text-gray-600">
                <Pencil className="w-3 h-3" />
              </button>
              {(template.status === 'Draft' ||
                template.status === 'Rejected' ||
                template.status === 'Paused') && (
                <button type="button" title="Submit to Meta" onClick={onSubmit} className="p-1 rounded-md hover:bg-[#e7f5f0] text-[#008069]">
                  <Send className="w-3 h-3" />
                </button>
              )}
            </>
          )}
          {template.id && (
            <button type="button" title="Delete" onClick={onDelete} className="p-1 rounded-md hover:bg-red-50 text-red-500">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EmailCard({
  template,
  onOpen,
  onEdit,
  onDelete,
}: {
  template: EmailTemplateRecord;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const sampleVars = buildSampleVariables(template.variables);
  const previewSubject = applyEmailTemplateVariables(template.subject, sampleVars);
  const previewHtml = wrapPreviewHtml(
    applyEmailTemplateVariables(template.htmlBody || '', sampleVars)
  );

  return (
    <div
      className="bg-surface border border-black/5 rounded-xl p-3 flex flex-col text-left hover:border-primary/30 transition-all cursor-pointer"
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-1.5 mb-2">
        <h5 className="font-bold text-gray-900 text-xs truncate font-mono min-w-0">{template.name}</h5>
        <span
          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border shrink-0 ${
            template.status === 'active'
              ? 'bg-primary/10 text-primary border-primary/20'
              : 'bg-gray-50 text-gray-500 border-gray-200'
          }`}
        >
          {template.status}
        </span>
      </div>
      <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-slate-200 bg-white pointer-events-none">
        <div className="bg-[#f5f5f5] px-2 py-1.5 border-b border-gray-200">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          </div>
          <p className="text-[9px] font-bold uppercase text-gray-400 leading-none">Subject</p>
          <p className="text-[11px] font-semibold text-gray-900 truncate mt-0.5">
            {previewSubject || 'Your subject line…'}
          </p>
        </div>
        <iframe
          title={`${template.name} preview`}
          srcDoc={previewHtml}
          className="w-full h-[160px] border-0 bg-white"
          sandbox=""
        />
      </div>
      <div
        className="pt-2 border-t border-gray-50 mt-2.5 flex flex-wrap justify-between items-center gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs font-bold text-gray-400">
          Updated {formatUpdated(template.updatedAt)}
        </span>
        <div className="flex gap-1">
          <button type="button" title="Edit" onClick={onEdit} className="p-1 rounded-md hover:bg-gray-100 text-gray-600">
            <Pencil className="w-3 h-3" />
          </button>
          {template.id && (
            <button type="button" title="Delete" onClick={onDelete} className="p-1 rounded-md hover:bg-red-50 text-red-500">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
