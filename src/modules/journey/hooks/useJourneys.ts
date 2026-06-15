import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import type { JourneyGraph, JourneyRecord } from '../types';

export function useJourneys() {
  return useQuery({
    queryKey: ['journeys'],
    queryFn: () => api.getJourneys() as Promise<JourneyRecord[]>,
  });
}

export function useJourney(id: string | null) {
  return useQuery({
    queryKey: ['journeys', id],
    queryFn: () => api.getJourney(id!) as Promise<JourneyRecord>,
    enabled: !!id,
  });
}

export function useJourneyGraph(journeyId: string | null) {
  return useQuery({
    queryKey: ['journeys', journeyId, 'graph'],
    queryFn: () => api.getJourneyGraph(journeyId!) as Promise<JourneyGraph>,
    enabled: !!journeyId,
  });
}

export function useJourneyAnalytics(journeyId: string | null) {
  return useQuery({
    queryKey: ['journeys', journeyId, 'analytics'],
    queryFn: () => api.getJourneyAnalytics(journeyId!),
    enabled: !!journeyId,
  });
}

export function useCreateJourney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.createJourney({ name }) as Promise<JourneyRecord>,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journeys'] }),
  });
}

export function useUpdateJourney(journeyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string }) =>
      api.updateJourney(journeyId, data) as Promise<JourneyRecord>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journeys'] });
      qc.invalidateQueries({ queryKey: ['journeys', journeyId] });
    },
  });
}

export function useSaveJourneyGraph(journeyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (graph: JourneyGraph) => api.saveJourneyGraph(journeyId, graph),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journeys', journeyId, 'graph'] });
      qc.invalidateQueries({ queryKey: ['journeys'] });
    },
  });
}

export function usePublishJourney(journeyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.publishJourney(journeyId) as Promise<JourneyRecord>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journeys'] });
      qc.invalidateQueries({ queryKey: ['journeys', journeyId] });
    },
  });
}

export function useDeleteJourney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteJourney(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journeys'] }),
  });
}
