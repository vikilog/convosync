/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, Rocket, Send, Code2, LayoutGrid } from 'lucide-react';
import { api, FlowValidationError } from '../../lib/api';
import { pathForTemplateEditor } from '../../routes';
import { WhatsAppFlowVisualBuilder } from './WhatsAppFlowVisualBuilder';
import {
  builderStateToFlowJson,
  emptyBuilderState,
  flowJsonToBuilderState,
  newFieldId,
  newScreenId,
  type BuilderState,
} from './flowBuilderTypes';

type Props = {
  flowId: string | null;
  onBack: () => void;
};

const STARTER_TEMPLATES: Record<
  string,
  { label: string; description: string; state: () => BuilderState }
> = {
  lead_capture: {
    label: 'Lead capture',
    description: 'Name, phone, and a short message — good for inbound inquiries.',
    state: () => ({
      screens: [
        {
          id: newScreenId(),
          title: 'Get in touch',
          footerLabel: 'Submit',
          nextScreenId: null,
          fields: [
            { id: newFieldId(), type: 'TextInput', label: 'Full name', name: 'full_name', required: true, options: [] },
            { id: newFieldId(), type: 'TextInput', label: 'Phone number', name: 'phone', required: true, options: [] },
            {
              id: newFieldId(),
              type: 'TextArea',
              label: 'What are you looking for?',
              name: 'message',
              required: false,
              options: [],
            },
          ],
        },
      ],
    }),
  },
  appointment_booking: {
    label: 'Appointment booking',
    description: 'Preferred date/time + service — good for salons, clinics, consultations.',
    state: () => ({
      screens: [
        {
          id: newScreenId(),
          title: 'Book an appointment',
          footerLabel: 'Request booking',
          nextScreenId: null,
          fields: [
            { id: newFieldId(), type: 'TextInput', label: 'Full name', name: 'full_name', required: true, options: [] },
            {
              id: newFieldId(),
              type: 'Dropdown',
              label: 'Service',
              name: 'service',
              required: true,
              options: ['Consultation', 'Follow-up'],
            },
            {
              id: newFieldId(),
              type: 'DatePicker',
              label: 'Preferred date',
              name: 'preferred_date',
              required: true,
              options: [],
            },
          ],
        },
      ],
    }),
  },
  feedback_survey: {
    label: 'Feedback survey',
    description: 'A quick satisfaction check-in — one rating + one open comment.',
    state: () => ({
      screens: [
        {
          id: newScreenId(),
          title: 'How did we do?',
          footerLabel: 'Send feedback',
          nextScreenId: null,
          fields: [
            {
              id: newFieldId(),
              type: 'RadioButtonsGroup',
              label: 'Rate your experience',
              name: 'rating',
              required: true,
              options: ['Excellent', 'Good', 'Okay', 'Poor', 'Very poor'],
            },
            {
              id: newFieldId(),
              type: 'TextArea',
              label: 'Anything you want to add?',
              name: 'comment',
              required: false,
              options: [],
            },
          ],
        },
      ],
    }),
  },
};

export const WhatsAppFlowEditor: React.FC<Props> = ({ flowId, onBack }) => {
  const navigate = useNavigate();
  const isEdit = Boolean(flowId);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'visual' | 'json'>('visual');
  const [visualUnavailable, setVisualUnavailable] = useState(false);
  const [builderState, setBuilderState] = useState<BuilderState>(() => emptyBuilderState());
  const [jsonText, setJsonText] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [notice, setNotice] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testError, setTestError] = useState('');
  const [testNotice, setTestNotice] = useState('');

  useEffect(() => {
    if (!flowId) return;
    let cancelled = false;
    setLoading(true);
    api
      .getWhatsAppFlow(flowId)
      .then((res) => {
        if (cancelled) return;
        const item = (res as { item?: { name: string; flowJson: unknown; status: string } }).item;
        if (item) {
          setName(item.name);
          setStatus(item.status === 'published' ? 'published' : 'draft');
          const parsed = flowJsonToBuilderState(item.flowJson);
          if (parsed) {
            setBuilderState(parsed);
            setMode('visual');
          } else {
            setVisualUnavailable(true);
            setMode('json');
          }
          setJsonText(JSON.stringify(item.flowJson, null, 2));
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load flow');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [flowId]);

  const applyStarter = (key: string) => {
    const starter = STARTER_TEMPLATES[key];
    if (!starter) return;
    const state = starter.state();
    setBuilderState(state);
    setJsonText(JSON.stringify(builderStateToFlowJson(state), null, 2));
    setJsonError('');
    if (!name.trim()) setName(starter.label);
  };

  const switchToJson = () => {
    setJsonText(JSON.stringify(builderStateToFlowJson(builderState), null, 2));
    setJsonError('');
    setMode('json');
  };

  const switchToVisual = () => {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(jsonText);
    } catch {
      setJsonError('This is not valid JSON — check for a missing comma or bracket.');
      return;
    }
    const parsed = flowJsonToBuilderState(parsedJson);
    if (!parsed) {
      setJsonError(
        'This JSON has a shape the visual builder can\'t represent (multiple screens or an unrecognized component) — keep editing it here.'
      );
      return;
    }
    setJsonError('');
    setBuilderState(parsed);
    setMode('visual');
  };

  const resolveFlowJson = (): { flowJson: unknown } | null => {
    if (mode === 'visual') {
      return { flowJson: builderStateToFlowJson(builderState) };
    }
    try {
      return { flowJson: JSON.parse(jsonText) };
    } catch {
      setJsonError('This is not valid JSON — check for a missing comma or bracket.');
      return null;
    }
  };

  const handleSave = async () => {
    setError('');
    setJsonError('');
    setNotice('');
    if (!name.trim()) {
      setError('Give this flow a name');
      return;
    }
    const resolved = resolveFlowJson();
    if (!resolved) return;
    setSaving(true);
    try {
      if (isEdit && flowId) {
        await api.updateWhatsAppFlow(flowId, { name: name.trim(), flowJson: resolved.flowJson });
        setNotice('Saved.');
      } else {
        const res = (await api.createWhatsAppFlow({
          name: name.trim(),
          flowJson: resolved.flowJson,
        })) as { item?: { id: string } };
        if (res.item?.id) {
          navigate(pathForTemplateEditor('flow', res.item.id), { replace: true });
        } else {
          onBack();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save flow');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setError('');
    setJsonError('');
    setNotice('');
    if (!flowId) return;
    const resolved = resolveFlowJson();
    if (!resolved) return;
    if (
      !window.confirm(
        'Publish this flow to WhatsApp? Once published it goes live on your Meta Business Account and the JSON can no longer be edited — you would need to create a new flow instead.'
      )
    ) {
      return;
    }
    setPublishing(true);
    try {
      // Publish whatever is currently in the editor, not just the last-saved
      // version — otherwise an unsaved edit would silently be dropped.
      await api.updateWhatsAppFlow(flowId, { name: name.trim(), flowJson: resolved.flowJson });
      await api.publishWhatsAppFlow(flowId);
      setStatus('published');
      setNotice('Published to Meta.');
    } catch (err) {
      if (err instanceof FlowValidationError) {
        const details = err.validationErrors
          .map((v) => {
            const e = v as { message?: string; pointers?: Array<{ path?: string }> };
            const path = e.pointers?.[0]?.path;
            return path ? `${path}: ${e.message}` : e.message;
          })
          .filter(Boolean)
          .join(' · ');
        setError(details ? `${err.message} — ${details}` : err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to publish flow');
      }
    } finally {
      setPublishing(false);
    }
  };

  const handleSendTest = async () => {
    setTestError('');
    setTestNotice('');
    if (!flowId) return;
    if (!testPhone.trim()) {
      setTestError('Enter a phone number, with country code');
      return;
    }
    setSendingTest(true);
    try {
      await api.sendTestWhatsAppFlow(flowId, { phone: testPhone.trim() });
      setTestNotice(`Sent to ${testPhone.trim()}.`);
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Failed to send test message');
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 animate-scale-up">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-primary transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to flows
      </button>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {notice}
        </div>
      ) : null}

      <div className="p-4 bg-white ring-1 ring-slate-200/80 rounded-xl space-y-3 shrink-0">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label className="block flex-1 min-w-[200px]">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Flow name
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Appointment booking"
              disabled={status === 'published'}
              className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70 disabled:cursor-not-allowed"
            />
          </label>

          {status === 'draft' && (
            <div className="flex bg-slate-100 rounded-xl p-1">
              <button
                type="button"
                onClick={switchToVisual}
                disabled={mode === 'visual'}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                  mode === 'visual' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Visual builder
              </button>
              <button
                type="button"
                onClick={switchToJson}
                disabled={mode === 'json'}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                  mode === 'json' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                Advanced (JSON)
              </button>
            </div>
          )}
        </div>

        {mode === 'visual' && !isEdit && (
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Start from a template
            </span>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Object.entries(STARTER_TEMPLATES).map(([key, tpl]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyStarter(key)}
                  className="text-left p-3 rounded-xl border border-slate-200 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <p className="text-xs font-bold text-gray-900">{tpl.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{tpl.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {visualUnavailable && mode === 'json' && (
          <p className="text-[11px] text-amber-700">
            This flow's JSON has a shape the visual builder can't represent, so it opened in
            Advanced mode.
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1 flex flex-col">
        {mode === 'visual' ? (
          <WhatsAppFlowVisualBuilder
            value={builderState}
            onChange={setBuilderState}
            readOnly={status === 'published'}
          />
        ) : (
          <div className="min-h-0 flex-1 flex flex-col p-4 bg-white ring-1 ring-slate-200/80 rounded-xl">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Flow JSON
            </span>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              spellCheck={false}
              disabled={status === 'published'}
              placeholder='{"version": "7.1", "screens": [...]}'
              className="flex-1 min-h-[320px] w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono outline-none focus:ring-2 focus:ring-primary/20 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
            {jsonError ? (
              <p className="mt-2 text-xs font-semibold text-red-600">{jsonError}</p>
            ) : null}
          </div>
        )}
      </div>

      {status === 'published' ? (
        <div className="shrink-0 p-4 bg-white ring-1 ring-slate-200/80 rounded-xl space-y-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            Send a test message
          </span>
          <div className="flex flex-wrap gap-2">
            <input
              type="tel"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="e.g. 919992492168"
              className="flex-1 min-w-[200px] bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              disabled={sendingTest}
              onClick={() => void handleSendTest()}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-[#008069] hover:bg-[#006e59] text-white inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              {sendingTest ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Send test
            </button>
          </div>
          {testError ? <p className="text-xs font-semibold text-red-600">{testError}</p> : null}
          {testNotice ? <p className="text-xs font-semibold text-channel-green">{testNotice}</p> : null}
        </div>
      ) : null}

      <div className="shrink-0 flex justify-end gap-2">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl text-sm font-bold border border-black/5 bg-white text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        {status === 'draft' && (
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-primary hover:bg-primary-hover text-white inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save draft
          </button>
        )}
        {isEdit && status === 'draft' && (
          <button
            type="button"
            disabled={publishing}
            onClick={() => void handlePublish()}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-[#008069] hover:bg-[#006e59] text-white inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            {publishing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Rocket className="w-3.5 h-3.5" />
            )}
            Publish to Meta
          </button>
        )}
      </div>
    </div>
  );
};
