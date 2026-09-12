import { useNavigate, useParams } from 'react-router-dom'

import { pathForContactsList } from '@/lib/navigation'
import { ContactDetailPage } from '@/pages/ContactDetailPage'

/** Route shell for /contacts/:contactId. */
export function ContactDetailRoute() {
  const { contactId } = useParams<{ contactId: string }>()
  const navigate = useNavigate()

  if (!contactId) {
    navigate(pathForContactsList(), { replace: true })
    return null
  }

  return <ContactDetailPage contactId={contactId} onBack={() => navigate(pathForContactsList())} />
}
