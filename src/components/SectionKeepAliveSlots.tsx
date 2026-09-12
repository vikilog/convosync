import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import { KeepAlive } from '@/components/KeepAlive'
import { PageSkeleton } from '@/components/PageSkeleton'
import { isLeadsPath } from '@/lib/leadPaths'
import { isContactsKeepAlivePath, isInboxPath, isSocialListeningPath, isTeamChatPath } from '@/lib/navigation'

const InboxPage = lazy(() => import('@/pages/InboxPage').then((m) => ({ default: m.InboxPage })))
const TeamChatPage = lazy(() => import('@/pages/TeamChatPage').then((m) => ({ default: m.TeamChatPage })))
const ContactsPage = lazy(() => import('@/pages/ContactsPage').then((m) => ({ default: m.ContactsPage })))
const LeadsPage = lazy(() => import('@/pages/LeadsPage').then((m) => ({ default: m.LeadsPage })))
const SocialListeningPage = lazy(() =>
  import('@/pages/SocialListeningPage').then((m) => ({ default: m.SocialListeningPage })),
)

/** Sibling keep-alive so leaving a tab does not unmount Inbox / Team Chat / Contacts / Leads / Social. */
export function SectionKeepAliveSlots({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const isInbox = isInboxPath(pathname)
  const isTeamChat = isTeamChatPath(pathname)
  const isContacts = isContactsKeepAlivePath(pathname)
  const isLeads = isLeadsPath(pathname)
  const isSocial = isSocialListeningPath(pathname)
  const [visitedInbox, setVisitedInbox] = useState(isInbox)
  const [visitedTeamChat, setVisitedTeamChat] = useState(isTeamChat)
  const [visitedContacts, setVisitedContacts] = useState(isContacts)
  const [visitedLeads, setVisitedLeads] = useState(isLeads)
  const [visitedSocial, setVisitedSocial] = useState(isSocial)

  useEffect(() => {
    if (isInbox) setVisitedInbox(true)
  }, [isInbox])
  useEffect(() => {
    if (isTeamChat) setVisitedTeamChat(true)
  }, [isTeamChat])
  useEffect(() => {
    if (isContacts) setVisitedContacts(true)
  }, [isContacts])
  useEffect(() => {
    if (isLeads) setVisitedLeads(true)
  }, [isLeads])
  useEffect(() => {
    if (isSocial) setVisitedSocial(true)
  }, [isSocial])

  const showOutlet = !isInbox && !isTeamChat && !isContacts && !isLeads && !isSocial

  return (
    <>
      {visitedInbox ? (
        <KeepAlive active={isInbox}>
          <Suspense fallback={<PageSkeleton />}>
            <InboxPage />
          </Suspense>
        </KeepAlive>
      ) : null}
      {visitedTeamChat ? (
        <KeepAlive active={isTeamChat}>
          <Suspense fallback={<PageSkeleton />}>
            <TeamChatPage />
          </Suspense>
        </KeepAlive>
      ) : null}
      {visitedContacts ? (
        <KeepAlive active={isContacts}>
          <Suspense fallback={<PageSkeleton />}>
            <ContactsPage />
          </Suspense>
        </KeepAlive>
      ) : null}
      {visitedLeads ? (
        <KeepAlive active={isLeads}>
          <Suspense fallback={<PageSkeleton />}>
            <LeadsPage />
          </Suspense>
        </KeepAlive>
      ) : null}
      {visitedSocial ? (
        <KeepAlive active={isSocial}>
          <Suspense fallback={<PageSkeleton />}>
            <SocialListeningPage />
          </Suspense>
        </KeepAlive>
      ) : null}
      {showOutlet ? <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">{children}</div> : null}
    </>
  )
}
