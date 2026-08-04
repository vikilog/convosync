import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useKeepAliveActivation } from '../../../components/KeepAlive';
import { instagramAutomationIdFromPath, pathForTab } from '../../../routes';
import { IgJourneyBuilder } from '../components/IgJourneyBuilder';
import { useIgJourney } from '../hooks/useIgJourneys';
import { useIgBuilderStore } from '../store/igBuilderStore';

export function IgAutomationWorkspace() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const journeyId = instagramAutomationIdFromPath(location.pathname);

  const journeyIdRef = useRef(journeyId);
  journeyIdRef.current = journeyId;

  useKeepAliveActivation(() => {
    void queryClient.invalidateQueries({ queryKey: ['instagram-journeys'] });
    const id = journeyIdRef.current;
    if (id) {
      void queryClient.invalidateQueries({ queryKey: ['instagram-journeys', id] });
      void queryClient.invalidateQueries({ queryKey: ['instagram-journeys', id, 'graph'] });
    }
  });

  const {
    data: activeJourney,
    isLoading: journeyLoading,
    isError: journeyMissing,
    isFetched,
  } = useIgJourney(journeyId);
  const setDirty = useIgBuilderStore((s) => s.setDirty);

  useEffect(() => {
    if (!journeyId || (isFetched && journeyMissing)) {
      navigate(pathForTab('automations'), { replace: true });
    }
  }, [journeyId, journeyMissing, isFetched, navigate]);

  if (!journeyId || journeyLoading || !activeJourney) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center text-sm text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#833AB4]" />
        Opening automation…
      </div>
    );
  }

  return (
    <IgJourneyBuilder
      journey={activeJourney}
      onBack={() => {
        setDirty(false);
        navigate(pathForTab('automations'));
      }}
    />
  );
}
