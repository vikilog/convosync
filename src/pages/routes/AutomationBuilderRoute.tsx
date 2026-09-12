import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { Skeleton } from '@/components/ui/skeleton'
import { channelFromAutomationPath, pathForAutomationList } from '@/lib/automationPaths'
import { AutomationBuilderPage } from '@/pages/AutomationBuilderPage'
import { realAutomationsService, type AutomationChannel } from '@/services/realAutomations.service'

/** Route shell for /automations/:automationId and deep WA/IG builder paths. */
export function AutomationBuilderRoute() {
  const { automationId } = useParams<{ automationId: string }>()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const pathChannel = channelFromAutomationPath(pathname)
  const { data: automations = [], isLoading: listLoading } = realAutomationsService.useList()
  const fromList = automations.find((a) => a.id === automationId)
  const channel: AutomationChannel = fromList?.channel ?? pathChannel ?? 'whatsapp'
  const needFetch = !fromList && !listLoading && Boolean(pathChannel)
  const { data: fetched, isLoading: getLoading, isError } = realAutomationsService.useGet(
    needFetch ? automationId : undefined,
    channel
  )

  const automation = fromList ?? fetched
  const loading = listLoading || (needFetch && getLoading)

  if (loading) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 flex-col p-4">
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  if (!automation || (needFetch && isError)) {
    navigate(pathForAutomationList(), { replace: true })
    return null
  }

  return (
    <AutomationBuilderPage
      automationId={automation.id}
      channel={automation.channel}
      name={automation.name}
      status={automation.status}
      onBack={() => navigate(pathForAutomationList())}
    />
  )
}
