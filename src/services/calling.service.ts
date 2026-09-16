import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { httpClient } from '@/lib/httpClient'

export type CallDirection = 'inbound' | 'outbound'
export type CallStatus = 'answered' | 'no-answer' | 'busy' | 'failed'

export type CallLogEntry = {
  id: string
  direction: CallDirection
  status: CallStatus
  contact: { phone: string; rawPhone: string; name: string | null; contactId: string | null }
  fromNumber: string
  startedAt: string | null
  durationSeconds: number
  hasRecording: boolean
}

export type CallLogResponse = {
  source: 'plivo' | 'telnyx' | 'mock' | 'none'
  entries: CallLogEntry[]
  nextCursor: number | null
}

export type ContactCallEntry = CallLogEntry & { numberId: string; numberLabel: string | null }

export type ContactCallsResponse = {
  source: 'plivo' | 'telnyx' | 'mock' | 'none'
  entries: ContactCallEntry[]
}

export type CallDetail = CallLogEntry & {
  recordUrl: string | null
  hangupCause: string | null
  transcript: string | null
  callUuid: string
  answerTime: string | null
  ringDurationSeconds: number | null
  postDialDelaySeconds: number | null
  hangupCauseCode: number | null
  hangupSource: string | null
  stirVerification: string | null
  sourceIp: string | null
  totalCostInrPaise: number | null
}

export const CALL_STATUS_LABEL: Record<CallStatus, string> = {
  answered: 'Answered',
  'no-answer': 'No answer',
  busy: 'Busy',
  failed: 'Failed',
}

/** Tone classes for status pills, matching the KPI-card `tone` pattern used on ReportsPage. */
export const CALL_STATUS_TONE: Record<CallStatus, string> = {
  answered: 'bg-[#e6f7ec] text-channel-green',
  'no-answer': 'bg-amber-50 text-amber-600',
  busy: 'bg-destructive/10 text-destructive',
  failed: 'bg-destructive/10 text-destructive',
}

export const callingService = {
  useCallLog: (numberId: string | undefined, options?: { refetchIntervalMs?: number | false }) =>
    useInfiniteQuery({
      queryKey: ['virtualNumber', 'callLog', numberId],
      queryFn: ({ pageParam }) =>
        httpClient.get<CallLogResponse>(`/virtual-number/${numberId}/call-log?cursor=${pageParam}&limit=20`),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      enabled: Boolean(numberId),
      refetchInterval: options?.refetchIntervalMs ?? false,
    }),

  /** A contact's calls across every number the workspace owns — for the Contact detail page. */
  useCallsForContact: (contactId: string | undefined) =>
    useQuery({
      queryKey: ['virtualNumber', 'callsForContact', contactId],
      queryFn: () => httpClient.get<ContactCallsResponse>(`/virtual-number/calls/for-contact/${contactId}`),
      enabled: Boolean(contactId),
    }),

  useCallDetail: (numberId: string | undefined, callId: string | undefined) =>
    useQuery({
      queryKey: ['virtualNumber', 'callLog', numberId, callId],
      queryFn: () =>
        httpClient.get<CallDetail>(`/virtual-number/${numberId}/call-log/${encodeURIComponent(callId!)}`),
      enabled: Boolean(numberId && callId),
    }),

  /** Places a real outbound call — rings `to` and bills the workspace's carrier account per minute. */
  usePlaceCall: (numberId: string | undefined) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (to: string) =>
        httpClient.post<{ requestUuid: string; message: string }>(`/virtual-number/${numberId}/call`, { to }),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['virtualNumber', 'callLog', numberId] }),
    })
  },
}
