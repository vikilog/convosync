import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Database, Eye, EyeOff, Loader2, RefreshCw } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { ApiError } from '@/lib/httpClient'
import {
  aiKnowledgeService,
  type KnowledgeCollection,
  type KnowledgeSyncStatus,
} from '@/services/aiKnowledge.service'

const STATUS_LABEL: Record<KnowledgeSyncStatus, string> = {
  pending: 'Not synced',
  syncing: 'Syncing…',
  success: 'Synced',
  failed: 'Failed',
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export function AiKnowledgePanel() {
  const { data: config, isLoading } = aiKnowledgeService.useConfig()
  const [venueId, setVenueId] = useState('')
  const [connectionString, setConnectionString] = useState('')
  const [showConnection, setShowConnection] = useState(false)
  const [collections, setCollections] = useState<KnowledgeCollection[]>([])
  const [error, setError] = useState<string | null>(null)
  const [syncingCollection, setSyncingCollection] = useState<string | null>(null)
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; name: string } | null>(
    null
  )

  const { data: record } = aiKnowledgeService.useRecord(config?.venueId ?? null)
  const listCollections = aiKnowledgeService.useListCollections()
  const syncCollection = aiKnowledgeService.useSyncCollection()

  useEffect(() => {
    if (config?.venueId) setVenueId(config.venueId)
  }, [config?.venueId])

  const credentials = () => {
    if (!connectionString.trim() || !venueId.trim()) {
      setError('Connection string and Venue ID are both required.')
      return null
    }
    return { connectionString: connectionString.trim(), venueId: venueId.trim() }
  }

  const handleLoad = () => {
    const input = credentials()
    if (!input) return
    setError(null)
    listCollections.mutate(input, {
      onSuccess: (res) => setCollections(res.collections),
      onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not load collections'),
    })
  }

  const handleSyncOne = (collectionName: string) => {
    const input = credentials()
    if (!input) return
    setError(null)
    setSyncingCollection(collectionName)
    syncCollection.mutate(
      { ...input, collectionName },
      {
        onSuccess: (res) => {
          setCollections((prev) =>
            prev.map((c) =>
              c.name === collectionName
                ? { ...c, synced: true, documentsFound: res.documentsFound }
                : c
            )
          )
        },
        onError: (err) => setError(err instanceof ApiError ? err.message : 'Sync failed'),
        onSettled: () => setSyncingCollection(null),
      }
    )
  }

  const handleSyncAll = async () => {
    const input = credentials()
    if (!input) return
    setError(null)
    let list = collections
    if (list.length === 0) {
      try {
        const res = await listCollections.mutateAsync(input)
        list = res.collections
        setCollections(list)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not load collections')
        return
      }
    }
    if (list.length === 0) {
      setError('No collections found in this database.')
      return
    }
    try {
      for (let i = 0; i < list.length; i++) {
        const col = list[i]
        if (!col) continue
        setSyncProgress({ current: i + 1, total: list.length, name: col.name })
        setSyncingCollection(col.name)
        const res = await syncCollection.mutateAsync({ ...input, collectionName: col.name })
        setCollections((prev) =>
          prev.map((c) =>
            c.name === col.name ? { ...c, synced: true, documentsFound: res.documentsFound } : c
          )
        )
        await sleep(300)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sync failed')
    } finally {
      setSyncingCollection(null)
      setSyncProgress(null)
    }
  }

  const syncing = syncingCollection !== null
  const status: KnowledgeSyncStatus = syncing ? 'syncing' : (record?.status ?? 'pending')

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-12 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading AI Knowledge…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-4" />
            External salon database
          </CardTitle>
          <p className="text-muted-foreground text-xs">
            Sync MongoDB collections scoped to a venue. Start with Venue, then Service, Client, etc.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ak-conn">MongoDB connection string</Label>
            <div className="relative">
              <Input
                id="ak-conn"
                type={showConnection ? 'text' : 'password'}
                value={connectionString}
                onChange={(e) => setConnectionString(e.target.value)}
                placeholder="mongodb+srv://user:pass@cluster/db"
                className="pr-10 font-mono text-xs"
                autoComplete="off"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1/2 right-1.5 -translate-y-1/2"
                onClick={() => setShowConnection((v) => !v)}
                aria-label={showConnection ? 'Hide connection string' : 'Show connection string'}
              >
                {showConnection ? <EyeOff /> : <Eye />}
              </Button>
            </div>
            {config?.hasConnectionString && config.connectionStringMasked ? (
              <p className="text-muted-foreground font-mono text-xs">Saved: {config.connectionStringMasked}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ak-venue">Venue ID</Label>
            <Input
              id="ak-venue"
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              placeholder="Salon / venue / branch ObjectId"
              className="font-mono text-xs"
            />
          </div>
          {error ? (
            <p className="text-destructive flex items-start gap-1.5 text-xs">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={listCollections.isPending || syncing} onClick={handleLoad}>
              {listCollections.isPending ? <Loader2 className="animate-spin" /> : <Database />}
              Load collections
            </Button>
            <Button size="sm" disabled={syncing || listCollections.isPending} onClick={() => void handleSyncAll()}>
              {syncProgress ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              {syncProgress ? 'Syncing all…' : 'Sync all'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {collections.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Collections ({collections.filter((c) => c.synced).length}/{collections.length} synced)
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {collections.map((col) => (
              <div key={col.name} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs font-medium">{col.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {col.synced
                      ? col.documentsFound != null
                        ? `${col.documentsFound} document(s) synced`
                        : 'Synced'
                      : 'Not synced yet'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {col.synced ? <CheckCircle2 className="size-4 text-emerald-600" /> : null}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={syncing}
                    onClick={() => handleSyncOne(col.name)}
                  >
                    {syncingCollection === col.name ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                    Sync
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div>
            <p className="text-muted-foreground text-xs">Status</p>
            <Badge variant={status === 'success' ? 'default' : 'outline'} className="mt-1">
              {STATUS_LABEL[status]}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Last sync</p>
            <p className="text-sm font-medium">
              {record?.syncedAt || config?.updatedAt
                ? new Date(record?.syncedAt ?? config?.updatedAt ?? '').toLocaleString()
                : '—'}
            </p>
          </div>
        </CardContent>
        {syncProgress ? (
          <CardContent>
            <p className="mb-1 text-xs">
              Syncing {syncProgress.name}… {syncProgress.current}/{syncProgress.total}
            </p>
            <Progress value={Math.round((syncProgress.current / syncProgress.total) * 100)} />
          </CardContent>
        ) : null}
        {record?.errorMessage && status === 'failed' ? (
          <CardContent>
            <p className="text-destructive text-xs">{record.errorMessage}</p>
          </CardContent>
        ) : null}
      </Card>
    </div>
  )
}
