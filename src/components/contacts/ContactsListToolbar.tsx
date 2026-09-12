import type { ComponentType } from 'react'
import { Ban, Columns3, Download, LayoutGrid, Search, Tag, Trash2, Upload, UserX, Users, X } from 'lucide-react'

import { AddContactSheet, type NewContactInput } from '@/components/contacts/AddContactSheet'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { CHANNEL_LABEL, ChannelIcon } from '@/components/channel-icon'
import { labelForCustomFieldKey } from '@/lib/contactDisplay'
import type { ContactChannelFilter, ContactListFilter, TagsMatchMode } from '@/services/realContacts.service'

const LIST_TABS: {
  id: ContactListFilter
  label: string
  icon: ComponentType<{ className?: string }>
}[] = [
  { id: 'all', label: 'All', icon: Users },
  { id: 'unsubscribe', label: 'Unsubscribed', icon: UserX },
  { id: 'blocklist', label: 'Blocklist', icon: Ban },
]

function pillClass(active: boolean) {
  return `inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
    active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
  }`
}

export function ContactsListToolbar({
  list,
  onListChange,
  channelFilter,
  onChannelFilterChange,
  connectedContactChannels,
  query,
  onQueryChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  selectedTags,
  tagsMatch,
  onTagsMatchChange,
  availableTags,
  onToggleTag,
  onClearTags,
  availableCustomFieldKeys,
  customColumnKeys,
  onToggleCustomColumn,
  contactCount,
  isLoading,
  selectedCount,
  singleTagFilter,
  deleteAllPending,
  deletingByTag,
  onImport,
  onExport,
  onDeleteSelected,
  onDeleteAllWithTag,
  onAdd,
}: {
  list: ContactListFilter
  onListChange: (list: ContactListFilter) => void
  channelFilter: 'all' | ContactChannelFilter
  onChannelFilterChange: (channel: 'all' | ContactChannelFilter) => void
  connectedContactChannels: ContactChannelFilter[]
  query: string
  onQueryChange: (query: string) => void
  dateFrom: string
  onDateFromChange: (value: string) => void
  dateTo: string
  onDateToChange: (value: string) => void
  selectedTags: string[]
  tagsMatch: TagsMatchMode
  onTagsMatchChange: (mode: TagsMatchMode) => void
  availableTags: string[]
  onToggleTag: (tag: string) => void
  onClearTags: () => void
  availableCustomFieldKeys: string[]
  customColumnKeys: string[]
  onToggleCustomColumn: (key: string) => void
  contactCount: number
  isLoading: boolean
  selectedCount: number
  singleTagFilter: string | null
  deleteAllPending: boolean
  deletingByTag: boolean
  onImport: () => void
  onExport: () => void
  onDeleteSelected: () => void
  onDeleteAllWithTag: () => void
  onAdd: (input: NewContactInput) => void
}) {
  return (
    <div className="shrink-0 space-y-4 border-b p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="bg-muted flex w-fit items-center rounded-lg p-[3px]">
          {LIST_TABS.map((tab) => {
            const active = list === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={active}
                onClick={() => onListChange(tab.id)}
                className={pillClass(active)}
              >
                <tab.icon className="size-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onImport}>
            <Upload />
            Import
          </Button>
          <Button variant="outline" size="sm" disabled={contactCount === 0 || isLoading} onClick={onExport}>
            <Download />
            Export
          </Button>
          {selectedCount > 0 ? (
            <Button variant="destructive" size="sm" onClick={onDeleteSelected}>
              <Trash2 />
              Delete ({selectedCount})
            </Button>
          ) : null}
          {singleTagFilter ? (
            <Button variant="destructive" size="sm" disabled={deleteAllPending} onClick={onDeleteAllWithTag}>
              <Trash2 />
              {deletingByTag ? 'Deleting…' : 'Delete all with tag'}
            </Button>
          ) : null}
          <AddContactSheet onAdd={onAdd} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search name, phone, email…"
            className="pl-8"
          />
        </div>
        <Input
          type="date"
          value={dateFrom}
          max={dateTo || undefined}
          onChange={(e) => onDateFromChange(e.target.value)}
          aria-label="From date"
          className="w-[9.5rem]"
        />
        <Input
          type="date"
          value={dateTo}
          min={dateFrom || undefined}
          onChange={(e) => onDateToChange(e.target.value)}
          aria-label="To date"
          className="w-[9.5rem]"
        />
        {connectedContactChannels.length > 1 ? (
          <div className="bg-muted flex w-fit items-center rounded-lg p-[3px]">
            <button
              type="button"
              aria-label="All channels"
              aria-pressed={channelFilter === 'all'}
              onClick={() => onChannelFilterChange('all')}
              className={pillClass(channelFilter === 'all')}
            >
              <LayoutGrid className="size-4" />
              All
            </button>
            {connectedContactChannels.map((id) => {
              const active = channelFilter === id
              return (
                <button
                  key={id}
                  type="button"
                  aria-label={CHANNEL_LABEL[id]}
                  aria-pressed={active}
                  onClick={() => onChannelFilterChange(id)}
                  className={pillClass(active)}
                >
                  <ChannelIcon channel={id} className="size-4" />
                  {CHANNEL_LABEL[id]}
                </button>
              )
            })}
          </div>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-44 justify-start">
              <Tag />
              {selectedTags.length === 0
                ? 'All tags'
                : `${selectedTags.length} tag${selectedTags.length === 1 ? '' : 's'} (${tagsMatch === 'all' ? 'AND' : 'OR'})`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {selectedTags.length > 1 ? (
              <>
                <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Match</DropdownMenuLabel>
                <div className="flex items-center gap-1 px-1.5 pb-1.5">
                  <Button
                    type="button"
                    variant={tagsMatch === 'any' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 flex-1"
                    onClick={() => onTagsMatchChange('any')}
                  >
                    Any (OR)
                  </Button>
                  <Button
                    type="button"
                    variant={tagsMatch === 'all' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 flex-1"
                    onClick={() => onTagsMatchChange('all')}
                  >
                    All (AND)
                  </Button>
                </div>
                <DropdownMenuSeparator />
              </>
            ) : null}
            {availableTags.length === 0 ? (
              <p className="text-muted-foreground px-2 py-1.5 text-sm">No tags yet</p>
            ) : (
              availableTags.map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag}
                  checked={selectedTags.includes(tag)}
                  onSelect={(e) => e.preventDefault()}
                  onCheckedChange={() => onToggleTag(tag)}
                >
                  {tag}
                </DropdownMenuCheckboxItem>
              ))
            )}
            {selectedTags.length > 0 ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onClearTags}>
                  <X />
                  Clear tags
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Columns3 />
              Add column
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Custom fields</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableCustomFieldKeys.length === 0 ? (
              <p className="text-muted-foreground px-2 py-1.5 text-xs">
                No custom fields on any loaded contact yet.
              </p>
            ) : (
              availableCustomFieldKeys.map((key) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={customColumnKeys.includes(key)}
                  onCheckedChange={() => onToggleCustomColumn(key)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {labelForCustomFieldKey(key)}
                </DropdownMenuCheckboxItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
