import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useKeepAliveActivation } from '../../../components/KeepAlive';
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

export function JourneyWorkspace() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
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

  const handleCreateConfirm = async (name: string) => {
    const created = await createJourney.mutateAsync(name);
    setDirty(false);
    setActiveId(created.id);
    setCreateDialogOpen(false);
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
        }}
      />
    );
  }

  return (
    <>
      <JourneyList
        journeys={journeys}
        loading={isLoading || createJourney.isPending}
        onCreate={() => setCreateDialogOpen(true)}
        onOpen={setActiveId}
        onDelete={handleDelete}
      />
      <JourneyNameDialog
        open={createDialogOpen}
        title="Name your journey"
        description="Choose a clear name before you start building the workflow."
        confirmLabel="Create journey"
        loading={createJourney.isPending}
        onClose={() => setCreateDialogOpen(false)}
        onConfirm={handleCreateConfirm}
      />
    </>
  );
}
