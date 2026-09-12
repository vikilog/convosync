import { ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Trash2, Users, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { ContactAvatar } from '@/components/inbox/ContactAvatar'
import { EmptyState } from '@/components/common/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CHANNEL_ICON_CLASS, CHANNEL_LABEL, ChannelIcon } from '@/components/channel-icon'
import { resolveContactChannel } from '@/lib/contactChannel'
import { formatCustomFieldValue, labelForCustomFieldKey, listLabelForContact } from '@/lib/contactDisplay'
import { PAGE_SIZE_OPTIONS, type PageSize } from '@/lib/contactsListView'
import { timeAgo } from '@/lib/leadLabels'
import type { Contact } from '@/services/realContacts.service'

export function ContactsTable({
  contacts,
  isLoading,
  isError,
  error,
  selectedIds,
  allVisibleSelected,
  someVisibleSelected,
  customColumnKeys,
  onToggleSelectAll,
  onToggleSelect,
  onDelete,
  onToggleCustomColumn,
  showingLabel,
  canPrev,
  canNext,
  onPrev,
  onNext,
  pageSize,
  onPageSizeChange,
}: {
  contacts: Contact[]
  isLoading: boolean
  isError: boolean
  error: unknown
  selectedIds: Set<string>
  allVisibleSelected: boolean
  someVisibleSelected: boolean
  customColumnKeys: string[]
  onToggleSelectAll: () => void
  onToggleSelect: (id: string) => void
  onDelete: (contact: Contact) => void
  onToggleCustomColumn: (key: string) => void
  showingLabel: string
  canPrev: boolean
  canNext: boolean
  onPrev: () => void
  onNext: () => void
  pageSize: PageSize
  onPageSizeChange: (size: PageSize) => void
}) {
  const navigate = useNavigate()
  const selectAllState = someVisibleSelected && !allVisibleSelected ? 'indeterminate' : allVisibleSelected

  return (
    <>
      <div className="min-h-0 flex-1 overflow-auto">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="border-destructive/20 bg-destructive/10 text-destructive m-4 rounded-xl border p-4 text-sm">
            Couldn't load contacts: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        ) : contacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No contacts found"
            description="Try changing list/channel filters or add your first contact."
            className="h-full rounded-none border-none"
          />
        ) : (
          <>
            <div className="flex items-center gap-2 border-b px-3 py-2 md:hidden">
              <Checkbox
                checked={selectAllState}
                onCheckedChange={onToggleSelectAll}
                aria-label="Select all contacts"
              />
              <span className="text-muted-foreground text-xs font-medium">
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
              </span>
            </div>
            <ul className="divide-y md:hidden">
              {contacts.map((contact) => (
                <li key={contact.id} className="px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Checkbox
                      checked={selectedIds.has(contact.id)}
                      onCheckedChange={() => onToggleSelect(contact.id)}
                      aria-label={`Select ${contact.name}`}
                    />
                    <ContactAvatar name={contact.name} src={contact.avatar} />
                    <button
                      type="button"
                      onClick={() => navigate(`/contacts/${contact.id}`)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-sm font-semibold">{contact.name}</p>
                      <p className="text-muted-foreground truncate text-xs">{contact.phone}</p>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive"
                      onClick={() => onDelete(contact)}
                      aria-label={`Delete ${contact.name}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden md:block">
              <Table>
                <TableHeader className="bg-background sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectAllState}
                        onCheckedChange={onToggleSelectAll}
                        aria-label="Select all contacts"
                      />
                    </TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>List</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Last active</TableHead>
                    {customColumnKeys.map((key) => (
                      <TableHead key={key}>
                        <span className="inline-flex items-center gap-1">
                          {labelForCustomFieldKey(key)}
                          <button
                            type="button"
                            onClick={() => onToggleCustomColumn(key)}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label={`Remove ${labelForCustomFieldKey(key)} column`}
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      </TableHead>
                    ))}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => {
                    const channel = resolveContactChannel(contact.phone)
                    return (
                      <TableRow
                        key={contact.id}
                        data-state={selectedIds.has(contact.id) ? 'selected' : undefined}
                        className="cursor-pointer"
                        onClick={() => navigate(`/contacts/${contact.id}`)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(contact.id)}
                            onCheckedChange={() => onToggleSelect(contact.id)}
                            aria-label={`Select ${contact.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="relative shrink-0">
                              <ContactAvatar name={contact.name} src={contact.avatar} />
                              <span
                                className={`ring-background absolute -right-0.5 -bottom-0.5 flex size-3.5 items-center justify-center rounded-full ring-2 ${CHANNEL_ICON_CLASS[channel]}`}
                              >
                                <ChannelIcon channel={channel} className="size-2" />
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{contact.name}</p>
                              <p className="text-muted-foreground truncate text-xs">{CHANNEL_LABEL[channel]}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">{contact.phone}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{contact.email || '—'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{contact.source || '—'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {listLabelForContact(contact.tags)}
                        </TableCell>
                        <TableCell>
                          {contact.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {contact.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="outline" className="uppercase">
                                  {tag}
                                </Badge>
                              ))}
                              {contact.tags.length > 2 ? (
                                <span className="text-muted-foreground text-[11px]">+{contact.tags.length - 2}</span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">{timeAgo(contact.updatedAt)}</TableCell>
                        {customColumnKeys.map((key) => {
                          const value = formatCustomFieldValue(contact.customFields?.[key])
                          return (
                            <TableCell
                              key={key}
                              className="text-muted-foreground max-w-[220px] truncate text-sm"
                              title={value}
                            >
                              {value}
                            </TableCell>
                          )
                        })}
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" aria-label="Contact actions">
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/contacts/${contact.id}`)}>
                                <Pencil />
                                View / edit contact
                              </DropdownMenuItem>
                              <DropdownMenuItem variant="destructive" onClick={() => onDelete(contact)}>
                                <Trash2 />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
        <p className="text-muted-foreground text-xs">{showingLabel}</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={!canPrev} onClick={onPrev}>
            <ChevronLeft />
            Prev
          </Button>
          <Button variant="outline" size="sm" disabled={!canNext} onClick={onNext}>
            Next
            <ChevronRight />
          </Button>
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v) as PageSize)}>
            <SelectTrigger size="sm" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  )
}
