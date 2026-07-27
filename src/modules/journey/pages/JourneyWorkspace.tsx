import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useKeepAliveActivation } from '../../../components/KeepAlive';
import { isJourneyGalleryPath, pathForJourneyGallery, pathForTab } from '../../../routes';
import { JourneyList } from '../components/JourneyList';
import { JourneyBuilder } from '../components/JourneyBuilder';
import { JourneyNameDialog } from '../components/JourneyNameDialog';
import {
  useCreateJourney,
  useDeleteJourney,
  useJourney,
  useJourneys,
} from '../hooks/useJourneys';
import { useJourneyBuilderStore } from '../store/journeyBuilderStore';
import { getJourneyTemplate, type JourneyTemplate } from '../templates';
import { JourneyGalleryPage } from './JourneyGalleryPage';

export function JourneyWorkspace() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const showGallery = isJourneyGalleryPath(location.pathname);

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const { data: journeys = [], isLoading } = useJourneys();

  useKeepAliveActivation(() => {
    void queryClient.invalidateQueries({ queryKey: ['journeys'] });
    const id = activeIdRef.current;
    if (id) {
      void queryClient.invalidateQueries({ queryKey: ['journeys', id] });
      void queryClient.invalidateQueries({ queryKey: ['journeys', id, 'graph'] });
    }
  });
  const { data: activeJourney } = useJourney(activeId);
  const createJourney = useCreateJourney();
  const deleteJourney = useDeleteJourney();
  const setDirty = useJourneyBuilderStore((s) => s.setDirty);

  const openBlankCreate = () => {
    setPendingTemplateId(null);
    setCreateDialogOpen(true);
  };

  const openTemplateCreate = (template: JourneyTemplate) => {
    setPendingTemplateId(template.id);
    setCreateDialogOpen(true);
  };

  const pendingTemplate = pendingTemplateId ? getJourneyTemplate(pendingTemplateId) : undefined;

  const handleCreateConfirm = async (name: string) => {
    setCreating(true);
    try {
      const created = await createJourney.mutateAsync(name);
      if (pendingTemplate) {
        await api.saveJourneyGraph(created.id, pendingTemplate.buildGraph());
        await queryClient.invalidateQueries({ queryKey: ['journeys', created.id, 'graph'] });
        await queryClient.invalidateQueries({ queryKey: ['journeys'] });
      }
      setDirty(false);
      setCreateDialogOpen(false);
      setPendingTemplateId(null);
      navigate(pathForTab('journey'), { replace: true });
      setActiveId(created.id);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this journey?')) return;
    await deleteJourney.mutateAsync(id);
    if (activeId === id) setActiveId(null);
  };

  if (activeId && activeJourney) {
    return (
      <JourneyBuilder
        journey={activeJourney}
        onBack={() => {
          setActiveId(null);
          setDirty(false);
          navigate(pathForTab('journey'));
        }}
      />
    );
  }

  return (
    <>
      {showGallery ? (
        <JourneyGalleryPage
          onBack={() => navigate(pathForTab('journey'))}
          onSelectTemplate={openTemplateCreate}
          onStartBlank={openBlankCreate}
        />
      ) : (
        <JourneyList
          journeys={journeys}
          loading={isLoading || createJourney.isPending || creating}
          onCreateBlank={openBlankCreate}
          onOpenGallery={() => navigate(pathForJourneyGallery())}
          onOpen={setActiveId}
          onDelete={handleDelete}
        />
      )}
      <JourneyNameDialog
        open={createDialogOpen}
        title={pendingTemplate ? `Create “${pendingTemplate.name}”` : 'Name your journey'}
        description={
          pendingTemplate
            ? "We'll pre-fill the workflow. You can edit messages and steps after creating."
            : 'Choose a clear name before you start building the workflow.'
        }
        initialName={pendingTemplate?.name ?? ''}
        confirmLabel={pendingTemplate ? 'Create from template' : 'Create journey'}
        loading={createJourney.isPending || creating}
        onClose={() => {
          if (createJourney.isPending || creating) return;
          setCreateDialogOpen(false);
          setPendingTemplateId(null);
        }}
        onConfirm={handleCreateConfirm}
      />
    </>
  );
}
