import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { LayoutDashboard, Plug, Users } from 'lucide-react'
import { toast } from 'sonner'

import { useKeepAliveActivation } from '@/components/KeepAlive'
import { type NewContactInput } from '@/components/contacts/AddContactSheet'
import { ContactsDashboard } from '@/components/contacts/ContactsDashboard'
import { ContactsListToolbar } from '@/components/contacts/ContactsListToolbar'
import { ContactsTable } from '@/components/contacts/ContactsTable'
import { ExportContactsSheet } from '@/components/contacts/ExportContactsSheet'
import { ImportContactsSheet } from '@/components/contacts/ImportContactsSheet'
import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useConnectedInboxChannels } from '@/hooks/useConnectedInboxChannels'
import {
  CONTACT_CHANNELS,
  CUSTOM_COLUMNS_STORAGE_KEY,
  contactsViewFromPath,
  readCustomColumns,
  type PageSize,
} from '@/lib/contactsListView'
import { pathForContactsDashboard, pathForContactsList } from '@/lib/navigation'
import {
  realContactsService,
  type Contact,
  type ContactChannelFilter,
  type ContactListFilter,
  type TagsMatchMode,
} from '@/services/realContacts.service'

const VIEW_TABS: { id: 'dashboard' | 'list'; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'list', label: 'Contacts', icon: Users },
]

export function ContactsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const confirm = useConfirm()
  const channels = useConnectedInboxChannels()

  useKeepAliveActivation(() => {
    void queryClient.invalidateQueries({ queryKey: ['realContacts'] })
  })

  const view = contactsViewFromPath(location.pathname)
  const [list, setList] = useState<ContactListFilter>('all')
  const [channelFilter, setChannelFilter] = useState<'all' | ContactChannelFilter>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagsMatch, setTagsMatch] = useState<TagsMatchMode>('any')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [pageSize, setPageSize] = useState<PageSize>(25)
  const [cursor, setCursor] = useState<string | null>(null)
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([])
  const [importOpen, setImportOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [customColumnKeys, setCustomColumnKeys] = useState<string[]>(readCustomColumns)

  const connectedContactChannels = channels.connected.filter((ch): ch is ContactChannelFilter =>
    CONTACT_CHANNELS.includes(ch as ContactChannelFilter)
  )

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), query ? 300 : 0)
    return () => window.clearTimeout(t)
  }, [query])

  useEffect(() => {
    if (searchParams.get('import') !== '1') return
    if (view !== 'list') {
      navigate({ pathname: pathForContactsList(), search: searchParams.toString() }, { replace: true })
      return
    }
    setImportOpen(true)
    const next = new URLSearchParams(searchParams)
    next.delete('import')
    setSearchParams(next, { replace: true })
  }, [navigate, searchParams, setSearchParams, view])

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_COLUMNS_STORAGE_KEY, JSON.stringify(customColumnKeys))
    } catch {
      // best-effort
    }
  }, [customColumnKeys])

  useEffect(() => {
    if (channels.isLoading) return
    if (connectedContactChannels.length === 0) return
    if (connectedContactChannels.length === 1) {
      if (channelFilter !== connectedContactChannels[0]) setChannelFilter(connectedContactChannels[0])
      return
    }
    if (channelFilter === 'all') return
    if (!connectedContactChannels.includes(channelFilter)) setChannelFilter('all')
  }, [channelFilter, channels.isLoading, connectedContactChannels])

  const { data, isLoading, isError, error } = realContactsService.useList({
    search: debouncedQuery.trim() || undefined,
    list,
    channel: channelFilter !== 'all' ? channelFilter : undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    tagsMatch,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    limit: pageSize,
    cursor,
  })
  const contacts = data?.items ?? []
  const { data: tagsRes } = realContactsService.useTags()
  const availableTags = tagsRes?.tags ?? []

  const createContactMutation = realContactsService.useCreate()
  const removeContact = realContactsService.useRemove()
  const countByTag = realContactsService.useCountByTag()
  const deleteByTag = realContactsService.useDeleteByTag()

  useEffect(() => {
    setCursor(null)
    setCursorStack([])
    setSelectedIds(new Set())
  }, [list, channelFilter, selectedTags, tagsMatch, debouncedQuery, pageSize, dateFrom, dateTo])

  const availableCustomFieldKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const contact of contacts) {
      for (const key of Object.keys(contact.customFields ?? {})) keys.add(key)
    }
    return [...keys].sort((a, b) => a.localeCompare(b))
  }, [contacts])

  const toggleCustomColumn = useCallback((key: string) => {
    setCustomColumnKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }, [])

  const allVisibleSelected = contacts.length > 0 && contacts.every((c) => selectedIds.has(c.id))
  const someVisibleSelected = contacts.some((c) => selectedIds.has(c.id))
  const singleTagFilter = selectedTags.length === 1 ? selectedTags[0] : null

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev)
        contacts.forEach((c) => next.delete(c.id))
        return next
      }
      const next = new Set(prev)
      contacts.forEach((c) => next.add(c.id))
      return next
    })
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const deleteContact = async (contact: Contact) => {
    const ok = await confirm({
      title: `Delete "${contact.name}"?`,
      description: 'This will also delete related conversations, messages, and journey history.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    removeContact.mutate(contact.id)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(contact.id)
      return next
    })
  }

  const deleteSelected = async () => {
    const ok = await confirm({
      title: `Delete ${selectedIds.size} contact${selectedIds.size === 1 ? '' : 's'}?`,
      description: 'This will also delete related conversations, messages, and journey history.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    selectedIds.forEach((id) => removeContact.mutate(id))
    setSelectedIds(new Set())
  }

  const deleteAllWithTag = async () => {
    if (!singleTagFilter) return
    try {
      const { count, tag } = await countByTag.mutateAsync(singleTagFilter)
      if (count === 0) {
        toast.error(`No contacts found with tag "${tag}".`)
        return
      }
      const ok = await confirm({
        title: `Delete ${count} contact${count === 1 ? '' : 's'} with tag "${tag}"?`,
        description: 'This will also delete related conversations, messages, and journey history. The tag itself will not be removed.',
        confirmLabel: 'Delete all',
        destructive: true,
      })
      if (!ok) return
      const result = await deleteByTag.mutateAsync(tag)
      setSelectedIds(new Set())
      if (result.failed > 0) {
        toast.error(`Deleted ${result.deleted} of ${result.deleted + result.failed}. ${result.failed} failed.`)
      } else {
        toast.success(`Deleted ${result.deleted} contact${result.deleted === 1 ? '' : 's'}.`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete contacts by tag')
    }
  }

  const addContact = (input: NewContactInput) => {
    createContactMutation.mutate({
      name: input.name,
      phone: input.phone,
      email: input.email,
      source: 'Manually added',
      tags: input.tags,
      ownerId: input.ownerId,
      customFields: input.customFields,
    })
  }

  const showConnectEmpty = !channels.isLoading && connectedContactChannels.length === 0
  const exportSuffix = `${list}${channelFilter !== 'all' ? `-${channelFilter}` : ''}`

  if (location.pathname === '/contacts' || location.pathname === '/contacts/') {
    const dest = searchParams.get('import') === '1' ? pathForContactsList() : pathForContactsDashboard()
    return <Navigate to={{ pathname: dest, search: location.search }} replace />
  }

  if (showConnectEmpty) {
    return (
      <EmptyState
        icon={Plug}
        title="Connect a channel first"
        description="Connect WhatsApp, Instagram, or Messenger to manage contacts."
        className="h-full rounded-none border-none"
        action={
          <Button onClick={() => navigate('/integrations')}>
            <Plug />
            Go to Integrations
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <div className="shrink-0 border-b p-4">
        <Tabs
          value={view}
          onValueChange={(v) => navigate(v === 'list' ? pathForContactsList() : pathForContactsDashboard())}
        >
          <TabsList>
            {VIEW_TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                <tab.icon />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {view === 'dashboard' ? (
        <ContactsDashboard />
      ) : (
        <>
          <ContactsListToolbar
            list={list}
            onListChange={setList}
            channelFilter={channelFilter}
            onChannelFilterChange={setChannelFilter}
            connectedContactChannels={connectedContactChannels}
            query={query}
            onQueryChange={setQuery}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
            selectedTags={selectedTags}
            tagsMatch={tagsMatch}
            onTagsMatchChange={setTagsMatch}
            availableTags={availableTags}
            onToggleTag={toggleTag}
            onClearTags={() => setSelectedTags([])}
            availableCustomFieldKeys={availableCustomFieldKeys}
            customColumnKeys={customColumnKeys}
            onToggleCustomColumn={toggleCustomColumn}
            contactCount={contacts.length}
            isLoading={isLoading}
            selectedCount={selectedIds.size}
            singleTagFilter={singleTagFilter}
            deleteAllPending={countByTag.isPending || deleteByTag.isPending}
            deletingByTag={deleteByTag.isPending}
            onImport={() => setImportOpen(true)}
            onExport={() => setExportOpen(true)}
            onDeleteSelected={() => void deleteSelected()}
            onDeleteAllWithTag={() => void deleteAllWithTag()}
            onAdd={addContact}
          />
          <ContactsTable
            contacts={contacts}
            isLoading={isLoading}
            isError={isError}
            error={error}
            selectedIds={selectedIds}
            allVisibleSelected={allVisibleSelected}
            someVisibleSelected={someVisibleSelected}
            customColumnKeys={customColumnKeys}
            onToggleSelectAll={toggleSelectAll}
            onToggleSelect={toggleSelect}
            onDelete={(contact) => void deleteContact(contact)}
            onToggleCustomColumn={toggleCustomColumn}
            showingLabel={`Showing ${contacts.length}${data?.hasMore || cursorStack.length > 0 ? '+' : ''}`}
            canPrev={cursorStack.length > 0 && !isLoading}
            canNext={Boolean(data?.hasMore) && !isLoading}
            onPrev={() => {
              const prev = cursorStack[cursorStack.length - 1] ?? null
              setCursorStack((s) => s.slice(0, -1))
              setCursor(prev)
            }}
            onNext={() => {
              if (!data?.nextCursor) return
              setCursorStack((s) => [...s, cursor])
              setCursor(data.nextCursor)
            }}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      <ImportContactsSheet open={importOpen} onOpenChange={setImportOpen} />
      <ExportContactsSheet
        open={exportOpen}
        onOpenChange={setExportOpen}
        contacts={contacts}
        selectedIds={selectedIds}
        fileSuffix={exportSuffix}
      />
    </div>
  )
}
