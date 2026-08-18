import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import type { IgJourneyGraph, IgJourneyRecord } from '../types';

export function useIgJourneys() {
  return useQuery({
    queryKey: ['instagram-journeys'],
    queryFn: () => api.getInstagramJourneys() as Promise<IgJourneyRecord[]>,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useIgJourney(id: string | null) {
  return useQuery({
    queryKey: ['instagram-journeys', id],
    queryFn: () => api.getInstagramJourney(id!) as Promise<IgJourneyRecord>,
    enabled: !!id,
  });
}

export function useIgJourneyGraph(journeyId: string | null) {
  return useQuery({
    queryKey: ['instagram-journeys', journeyId, 'graph'],
    queryFn: () => api.getInstagramJourneyGraph(journeyId!) as Promise<IgJourneyGraph>,
    enabled: !!journeyId,
  });
}

export function useCreateIgJourney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api.createInstagramJourney({ name }) as Promise<IgJourneyRecord>,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instagram-journeys'] }),
  });
}

export function useUpdateIgJourney(journeyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string }) =>
      api.updateInstagramJourney(journeyId, data) as Promise<IgJourneyRecord>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instagram-journeys'] });
      qc.invalidateQueries({ queryKey: ['instagram-journeys', journeyId] });
    },
  });
}

export function useSaveIgJourneyGraph(journeyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (graph: IgJourneyGraph) => api.saveInstagramJourneyGraph(journeyId, graph),
    onSuccess: (_data, graph) => {
      // Write the saved graph straight into the cache instead of invalidating
      // it — invalidate+refetch is async, so the builder's draftGraph can't
      // safely be cleared until the cache reflects what was just saved.
      qc.setQueryData(['instagram-journeys', journeyId, 'graph'], graph);
      qc.invalidateQueries({ queryKey: ['instagram-journeys'] });
    },
  });
}

export function usePublishIgJourney(journeyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.publishInstagramJourney(journeyId) as Promise<IgJourneyRecord>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instagram-journeys'] });
      qc.invalidateQueries({ queryKey: ['instagram-journeys', journeyId] });
    },
  });
}

export function useDeleteIgJourney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteInstagramJourney(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instagram-journeys'] }),
  });
}
