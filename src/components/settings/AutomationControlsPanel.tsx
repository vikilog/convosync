import { useCallback, useEffect, useState } from 'react';
import { Loader2, PauseCircle, Plus, Save, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';

type MenuItem = {
  id: string;
  title: string;
  type: 'postback' | 'web_url';
  payload?: string;
  url?: string;
};

type AutomationSettings = {
  automationsPaused: boolean;
  defaultReplyEnabled: boolean;
  defaultReplyText: string | null;
  persistentMenu: { enabled: boolean; items: MenuItem[] };
};

function newItem(): MenuItem {
  return {
    id: `item_${crypto.randomUUID().slice(0, 6)}`,
    title: '',
    type: 'postback',
    payload: '',
  };
}

export function AutomationControlsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [defaultEnabled, setDefaultEnabled] = useState(false);
  const [defaultText, setDefaultText] = useState('');
  const [menuEnabled, setMenuEnabled] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await api.getWorkspaceAutomation()) as AutomationSettings;
      setPaused(Boolean(data.automationsPaused));
      setDefaultEnabled(Boolean(data.defaultReplyEnabled));
      setDefaultText(data.defaultReplyText ?? '');
      setMenuEnabled(Boolean(data.persistentMenu?.enabled));
      setMenuItems(
        Array.isArray(data.persistentMenu?.items) && data.persistentMenu.items.length > 0
          ? data.persistentMenu.items
          : [newItem()]
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load automation settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const items = menuItems
        .map((item) => ({
          ...item,
          title: item.title.trim(),
          payload: (item.payload || item.title).trim(),
          url: item.url?.trim(),
        }))
        .filter((item) => item.title);
      const res = (await api.updateWorkspaceAutomation({
        automationsPaused: paused,
        defaultReplyEnabled: defaultEnabled,
        defaultReplyText: defaultText.trim() || null,
        persistentMenu: { enabled: menuEnabled, items },
        syncMenu: true,
      })) as AutomationSettings & {
        menuSync?: { instagram: string; messenger: string; errors: string[] };
      };
      setMessage('Saved');
      if (res.menuSync?.errors?.length) {
        setMessage(`Saved — menu sync warnings: ${res.menuSync.errors.join('; ')}`);
      } else if (res.menuSync) {
        setMessage(
          `Saved — menu sync IG:${res.menuSync.instagram} Messenger:${res.menuSync.messenger}`
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-1">
      <div>
        <h2 className="text-lg font-bold text-dark-navy">Automation controls</h2>
        <p className="mt-1 text-sm text-slate-500">
          Workspace-wide pause, default reply, and Instagram/Messenger persistent menu.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      <section className="rounded-xl border-[0.5px] border-border-subtle bg-white p-4">
        <div className="flex items-start gap-3">
          <PauseCircle className="mt-0.5 h-5 w-5 text-amber-600" />
          <div className="min-w-0 flex-1">
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span>
                <span className="block text-sm font-semibold text-dark-navy">
                  Pause all automations
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  Stops Journeys, Instagram Automation, AgentFlow, and AI auto-replies immediately.
                  Human inbox replies still work.
                </span>
              </span>
              <input
                type="checkbox"
                checked={paused}
                onChange={(e) => setPaused(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border-[0.5px] border-border-subtle bg-white p-4">
        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span>
            <span className="block text-sm font-semibold text-dark-navy">Default reply</span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Sent once when a message arrives on an unassigned conversation and nothing else
              handles it.
            </span>
          </span>
          <input
            type="checkbox"
            checked={defaultEnabled}
            onChange={(e) => setDefaultEnabled(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
        </label>
        <textarea
          value={defaultText}
          onChange={(e) => setDefaultText(e.target.value)}
          rows={3}
          placeholder="Thanks for messaging us — a teammate will get back shortly."
          className="w-full rounded-lg border-[0.5px] border-border-subtle bg-surface px-3 py-2 text-sm text-dark-navy focus:outline-none focus:ring-2 focus:ring-primary/20"
          disabled={!defaultEnabled}
        />
      </section>

      <section className="space-y-3 rounded-xl border-[0.5px] border-border-subtle bg-white p-4">
        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span>
            <span className="block text-sm font-semibold text-dark-navy">
              Persistent menu (Instagram & Messenger)
            </span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Always-visible menu in IG/Messenger chats. WhatsApp has no native persistent menu.
              Postback payloads are treated as inbound keywords.
            </span>
          </span>
          <input
            type="checkbox"
            checked={menuEnabled}
            onChange={(e) => setMenuEnabled(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
        </label>

        <div className={`space-y-2 ${menuEnabled ? '' : 'pointer-events-none opacity-50'}`}>
          {menuItems.map((item, index) => (
            <div
              key={item.id}
              className="grid gap-2 rounded-lg border-[0.5px] border-border-subtle bg-surface p-2.5 sm:grid-cols-[1fr_110px_1fr_auto]"
            >
              <input
                value={item.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setMenuItems((rows) =>
                    rows.map((r, i) => (i === index ? { ...r, title } : r))
                  );
                }}
                placeholder="Title"
                className="rounded-md border-[0.5px] border-border-subtle bg-white px-2 py-1.5 text-sm"
              />
              <select
                value={item.type}
                onChange={(e) => {
                  const type = e.target.value as 'postback' | 'web_url';
                  setMenuItems((rows) =>
                    rows.map((r, i) => (i === index ? { ...r, type } : r))
                  );
                }}
                className="rounded-md border-[0.5px] border-border-subtle bg-white px-2 py-1.5 text-sm"
              >
                <option value="postback">Postback</option>
                <option value="web_url">URL</option>
              </select>
              {item.type === 'web_url' ? (
                <input
                  value={item.url ?? ''}
                  onChange={(e) => {
                    const url = e.target.value;
                    setMenuItems((rows) =>
                      rows.map((r, i) => (i === index ? { ...r, url } : r))
                    );
                  }}
                  placeholder="https://"
                  className="rounded-md border-[0.5px] border-border-subtle bg-white px-2 py-1.5 text-sm"
                />
              ) : (
                <input
                  value={item.payload ?? ''}
                  onChange={(e) => {
                    const payload = e.target.value;
                    setMenuItems((rows) =>
                      rows.map((r, i) => (i === index ? { ...r, payload } : r))
                    );
                  }}
                  placeholder="Payload / keyword"
                  className="rounded-md border-[0.5px] border-border-subtle bg-white px-2 py-1.5 text-sm"
                />
              )}
              <button
                type="button"
                onClick={() => setMenuItems((rows) => rows.filter((_, i) => i !== index))}
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-slate-400 hover:bg-white hover:text-rose-600"
                aria-label="Remove menu item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {menuItems.length < 5 ? (
            <button
              type="button"
              onClick={() => setMenuItems((rows) => [...rows, newItem()])}
              className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-primary"
            >
              <Plus className="h-4 w-4" />
              Add item
            </button>
          ) : null}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
      </div>
    </div>
  );
}
