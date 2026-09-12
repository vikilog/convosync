export type LeadFilterSource = 'all' | string

export type FilterableLead = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  requirement: string
  source: string
  stageId: string | null
  origin?: { username?: string } | null
}

/** Same haystack as the old LeadsKanbanView (name/phone/email/requirement/IG handle). */
export function leadMatchesFilters(
  lead: FilterableLead,
  query: string,
  sourceFilter: LeadFilterSource
): boolean {
  if (sourceFilter !== 'all' && lead.source !== sourceFilter) return false
  const q = query.trim().toLowerCase()
  if (!q) return true
  const hay = [lead.name ?? '', lead.phone ?? '', lead.email ?? '', lead.requirement, lead.origin?.username ?? '']
    .join(' ')
    .toLowerCase()
  return hay.includes(q)
}

/** dnd-kit may report the card under the pointer; map that back to a board. */
export function resolveDropStageId(
  overId: string,
  stages: Array<{ id: string }>,
  leads: Array<{ id: string; stageId: string | null }>
): string | null {
  if (stages.some((s) => s.id === overId)) return overId
  return leads.find((l) => l.id === overId)?.stageId ?? null
}
