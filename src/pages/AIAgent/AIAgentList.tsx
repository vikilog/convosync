import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { Plus, LayoutGrid, List, Sparkles } from 'lucide-react';
import type { AgentBot } from '../../types';
import type { AgentType } from '../../components/ai-agent/types';
import { api } from '../../lib/api';
import { mapAgentFromApi } from '../../lib/mappers';
import { pathForAgent } from '../../routes';
import { useKeepAliveActivation } from '../../components/KeepAlive';
import { AgentListRow, AgentGridCard } from '../../components/ai-agent/AgentCard';
import { CreateAgentModal } from './CreateAgentModal';
import { DeleteAgentDialog } from './DeleteAgentDialog';

type ViewMode = 'list' | 'grid';
const VIEW_STORAGE_KEY = 'convosync_ai_agent_view';

function loadViewMode(): ViewMode {
  const stored = localStorage.getItem(VIEW_STORAGE_KEY);
  return stored === 'grid' ? 'grid' : 'list';
}

export const AIAgentList: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<AgentBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>(loadViewMode);
  const [showNameModal, setShowNameModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AgentType | null>(null);
  const [newAgentName, setNewAgentName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AgentBot | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAgents = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    if (!options?.silent) setError(null);
    try {
      const raw = await api.getAgents();
      setAgents((raw as Record<string, unknown>[]).map((a) => mapAgentFromApi(a)));
    } catch (err) {
      if (!options?.silent) {
        setError(err instanceof Error ? err.message : 'Failed to load agents');
      }
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAgents();
  }, [loadAgents]);

  useKeepAliveActivation(() => {
    void loadAgents({ silent: true });
  });

  const setView = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_STORAGE_KEY, mode);
  };

  const openCreateAgent = () => {
    setSelectedCategory('ai_agent');
    setNewAgentName('');
    setShowNameModal(true);
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim() || !selectedCategory) return;

    setCreating(true);
    setError(null);
    try {
      const created = await api.createAgent({
        name: newAgentName.trim(),
        category: selectedCategory,
      });
      const mapped = mapAgentFromApi(created as Record<string, unknown>);
      setShowNameModal(false);
      setSelectedCategory(null);
      setNewAgentName('');
      navigate(pathForAgent(mapped.id, 'profile'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (agent: AgentBot) => {
    navigate(pathForAgent(agent.id, 'profile'));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    setError(null);
    try {
      await api.deleteAgent(deleteTarget.id);
      setDeleteTarget(null);
      await loadAgents({ silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete agent');
    } finally {
      setDeletingId(null);
    }
  };

  const liveCount = agents.filter((a) => a.isEnabled).length;

  return (
    <div className="w-full text-left">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-slate-900 text-xl leading-tight">AI Agent</h1>
            {!loading && agents.length > 0 && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {agents.length} total · {liveCount} live
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Build and manage your agents from one place.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {agents.length > 0 && (
            <div className="inline-flex items-center rounded-lg border border-black/5 bg-surface p-0.5">
              <button
                type="button"
                onClick={() => setView('list')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:bg-surface-muted'
                }`}
                aria-label="List view"
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setView('grid')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:bg-surface-muted'
                }`}
                aria-label="Card view"
                title="Card view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={openCreateAgent}
            className="bg-primary hover:bg-primary-hover text-white px-3.5 py-2 rounded-lg flex items-center gap-1.5 text-sm font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Agent
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 bg-red-50 border border-red-100 text-red-600 text-xs font-medium px-3 py-2.5 rounded-lg">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="rounded-xl border border-black/5 bg-surface px-4 py-10 text-center text-sm text-slate-500">
          Loading agents…
        </div>
      ) : agents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/10 bg-surface-muted/50 px-6 py-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface border border-black/5 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-semibold text-slate-900">No agents yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Create your first AI agent to automate customer conversations.
          </p>
          <button
            type="button"
            onClick={openCreateAgent}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Agent
          </button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="rounded-xl border border-black/5 bg-surface overflow-hidden">
          {agents.map((agent) => (
            <AgentListRow
              key={agent.id}
              agent={agent}
              onEdit={() => handleEdit(agent)}
              onDelete={() => setDeleteTarget(agent)}
              deleting={deletingId === agent.id}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {agents.map((agent) => (
            <AgentGridCard
              key={agent.id}
              agent={agent}
              onEdit={() => handleEdit(agent)}
              onDelete={() => setDeleteTarget(agent)}
              deleting={deletingId === agent.id}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showNameModal && selectedCategory && (
          <CreateAgentModal
            category={selectedCategory}
            name={newAgentName}
            creating={creating}
            onNameChange={setNewAgentName}
            onClose={() => {
              setShowNameModal(false);
              setSelectedCategory(null);
            }}
            onSubmit={(e) => void handleCreateAgent(e)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <DeleteAgentDialog
            agent={deleteTarget}
            deleting={deletingId === deleteTarget.id}
            onClose={() => setDeleteTarget(null)}
            onConfirm={() => void handleDelete()}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
