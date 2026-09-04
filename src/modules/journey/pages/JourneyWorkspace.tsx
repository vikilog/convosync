import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { api } from '../../../lib/api';
import { useKeepAliveActivation } from '../../../components/KeepAlive';
import {
  isJourneyGalleryPath,
  journeyIdFromPath,
  pathForJourney,
  pathForTab,
} from '../../../routes';
import { JourneyBuilder } from '../components/JourneyBuilder';
import { JourneyNameDialog } from '../components/JourneyNameDialog';
import { useCreateJourney, useJourney, useJourneys } from '../hooks/useJourneys';
import { useJourneyBuilderStore } from '../store/journeyBuilderStore';
import { getJourneyTemplate, type JourneyTemplate } from '../templates';
import { JourneyGalleryPage } from './JourneyGalleryPage';

export function JourneyWorkspace() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const showGallery = isJourneyGalleryPath(location.pathname);
  const journeyId = journeyIdFromPath(location.pathname);

  const journeyIdRef = useRef(journeyId);
  journeyIdRef.current = journeyId;
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  useJourneys();

  useKeepAliveActivation(() => {
    void queryClient.invalidateQueries({ queryKey: ['journeys'] });
    const id = journeyIdRef.current;
    if (id) {
      void queryClient.invalidateQueries({ queryKey: ['journeys', id] });
      void queryClient.invalidateQueries({ queryKey: ['journeys', id, 'graph'] });
    }
  });

  const {
    data: activeJourney,
    isLoading: journeyLoading,
    isError: journeyMissing,
    isFetched,
  } = useJourney(journeyId);
  const createJourney = useCreateJourney();
  const setDirty = useJourneyBuilderStore((s) => s.setDirty);

  useEffect(() => {
    if (journeyId && isFetched && journeyMissing) {
      navigate(pathForTab('automations'), { replace: true });
    }
  }, [journeyId, journeyMissing, isFetched, navigate]);

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
      navigate(pathForJourney(created.id));
    } finally {
      setCreating(false);
    }
  };

  if (journeyId) {
    if (journeyLoading || !activeJourney) {
      return (
        <div className="flex h-full min-h-0 items-center justify-center text-sm text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-swiss-accent" />
          Opening journey…
        </div>
      );
    }

    return (
      <JourneyBuilder
        key={activeJourney.id}
        journey={activeJourney}
        onBack={() => {
          if (
            useJourneyBuilderStore.getState().isDirty &&
            !window.confirm('You have unsaved changes. Leave without saving?')
          ) {
            return;
          }
          setDirty(false);
          navigate(pathForTab('automations'));
        }}
      />
    );
  }

  if (showGallery) {
    return (
      <>
        <JourneyGalleryPage
          onBack={() => navigate(pathForTab('automations'))}
          onSelectTemplate={openTemplateCreate}
          onStartBlank={openBlankCreate}
        />
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

  return (
    <div className="flex h-full min-h-0 items-center justify-center text-sm text-slate-500">
      <Loader2 className="mr-2 h-5 w-5 animate-spin text-swiss-accent" />
      Opening automations…
    </div>
  );
}
