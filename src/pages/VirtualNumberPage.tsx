import { useNavigate } from 'react-router-dom'

import { VirtualNumberFlow } from '@/components/integrations/VirtualNumberFlow'

export function VirtualNumberPage() {
  const navigate = useNavigate()
  return <VirtualNumberFlow onBack={() => navigate('/integrations')} />
}
