import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { InboxScope } from '@/lib/inboxScope'
import { httpClient } from '@/lib/httpClient'

export type { InboxScope }
export type MemberRole = 'admin' | 'agent'

export type WorkspaceMember = {
  id: string
  userId: string
  name: string
  email: string
  phone: string | null
  role: MemberRole
  permissions: string[]
  inboxScope: InboxScope
  autoAssignEligible: boolean
  assignmentLimit: number | null
  avatar: string | null
  status: 'active'
  isOwner: boolean
  joinedAt: string
}

/** Real backend hardcodes 3 seats including the owner — see workspaceMemberAdmin.ts. */
export const MAX_TEAM_MEMBERS = 3

export type AddMemberInput = {
  email: string
  name?: string
  password?: string
  role: MemberRole
  permissions?: string[]
  inboxScope?: InboxScope
}

export type UpdateMemberInput = {
  role: MemberRole
  permissions?: string[]
  inboxScope?: InboxScope
  autoAssignEligible?: boolean
  assignmentLimit?: number | null
}

const listKey = ['realWorkspaceMembers'] as const

export const realWorkspaceMembersService = {
  useList: () =>
    useQuery({
      queryKey: listKey,
      queryFn: () => httpClient.get<WorkspaceMember[]>('/workspace/members'),
    }),

  useAdd: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: AddMemberInput) =>
        httpClient.post<{ member: WorkspaceMember; createdUser: boolean }>('/workspace/members', input),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: listKey }),
    })
  },

  useUpdate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: UpdateMemberInput }) =>
        httpClient.patch<WorkspaceMember>(`/workspace/members/${id}`, patch),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: listKey }),
    })
  },

  useRemove: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => httpClient.del<{ success: boolean }>(`/workspace/members/${id}`),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: listKey }),
    })
  },
}
