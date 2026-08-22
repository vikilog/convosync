/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Unlink, X } from 'lucide-react';
import { api } from '../../lib/api';
import { extractFlowFields, type FlowFieldOption } from './flowFieldExtract';
import type { AvailableFlow, ConnectedFlow, DataTableColumn } from './types';

type Props = {
  open: boolean;
  onClose: () => void;
  tableId: string;
  columns: DataTableColumn[];
};

function bestGuessMap(columns: DataTableColumn[], fields: FlowFieldOption[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const col of columns) {
    const match = fields.find(
      (f) =>
        f.name.toLowerCase() === col.key.toLowerCase() ||
        f.label.toLowerCase() === col.label.toLowerCase()
    );
    if (match) map[col.key] = match.name;
  }
  return map;
}

export function ConnectFlowModal({ open, onClose, tableId, columns }: Props) {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState<ConnectedFlow[]>([]);
  const [available, setAvailable] = useState<AvailableFlow[]>([]);
  const [error, setError] = useState('');

  const [pickingFlowId, setPickingFlowId] = useState('');
  const [flowFields, setFlowFields] = useState<FlowFieldOption[]>([]);
  const [fieldMap, setFieldMap] = useState<Record<string, string>>({});
  const [loadingFields, setLoadingFields] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = (await api.getDataTableFlows(tableId)) as {
        connected: ConnectedFlow[];
        available: AvailableFlow[];
      };
      setConnected(res.connected);
      setAvailable(res.available);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load flows');
    } finally {
      setLoading(false);
    }
  }, [tableId]);

  useEffect(() => {
    if (!open) return;
    setPickingFlowId('');
    setFlowFields([]);
    setFieldMap({});
    void load();
  }, [open, load]);

  if (!open) return null;

  const handlePickFlow = async (flowId: string) => {
    setPickingFlowId(flowId);
    setFieldMap({});
    setFlowFields([]);
    if (!flowId) return;
    setLoadingFields(true);
    try {
      const res = (await api.getWhatsAppFlow(flowId)) as { item: { flowJson: unknown } };
      const fields = extractFlowFields(res.item.flowJson);
      setFlowFields(fields);
      setFieldMap(bestGuessMap(columns, fields));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load flow fields');
    } finally {
      setLoadingFields(false);
    }
  };

  const handleConnect = async () => {
    if (!pickingFlowId) return;
    setSaving(true);
    setError('');
    try {
      await api.connectDataTableFlow(tableId, { flowId: pickingFlowId, fieldMap });
      setPickingFlowId('');
      setFlowFields([]);
      setFieldMap({});
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect flow');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async (flowId: string) => {
    setSaving(true);
    setError('');
    try {
      await api.disconnectDataTableFlow(tableId, flowId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect flow');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-lg space-y-4 rounded-2xl bg-white ring-1 ring-slate-200/80 p-6 shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-black text-gray-950">Connect a Flow</h3>
            <p className="mt-1 text-xs text-slate-500">
              Every submission of a connected flow appends one row here, mapped by field.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:bg-surface-muted"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <>
            {connected.length > 0 ? (
              <div className="space-y-2">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                  Connected
                </span>
                {connected.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-black/5 px-3 py-2"
                  >
                    <span className="text-sm font-semibold text-gray-800">{f.name}</span>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleDisconnect(f.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      Disconnect
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="space-y-2">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                Connect a published flow
              </span>
              {available.length === 0 ? (
                <p className="text-xs text-gray-400">
                  No other published flows available. Publish a flow first from Templates → Flows.
                </p>
              ) : (
                <select
                  value={pickingFlowId}
                  onChange={(e) => void handlePickFlow(e.target.value)}
                  className="w-full rounded-xl border border-black/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select a flow…</option>
                  {available.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                      {f.connectedElsewhere ? ' (connected to another table)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {pickingFlowId ? (
              loadingFields ? (
                <div className="flex justify-center py-6 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2 rounded-xl border border-black/5 p-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Map columns to flow fields
                  </span>
                  {columns.map((col) => (
                    <div key={col.id} className="flex items-center gap-2">
                      <span className="w-32 shrink-0 text-xs font-semibold text-gray-700 truncate">
                        {col.label}
                      </span>
                      <select
                        value={fieldMap[col.key] ?? ''}
                        onChange={(e) =>
                          setFieldMap((prev) => ({ ...prev, [col.key]: e.target.value }))
                        }
                        className="flex-1 rounded-lg border border-black/5 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">— not mapped —</option>
                        {flowFields.map((f) => (
                          <option key={f.name} value={f.name}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleConnect()}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-hover disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      Connect
                    </button>
                  </div>
                </div>
              )
            ) : null}
          </>
        )}

        {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
