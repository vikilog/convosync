import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

/** Object URL for a cached blob. Revokes on unmount / blob change. */
export function useObjectUrl(blob: Blob | undefined) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (!blob) {
      setUrl('')
      return
    }
    const objectUrl = URL.createObjectURL(blob)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [blob])

  return url
}

/** Fetch an authenticated blob via React Query and expose an object URL. */
export function useBlobUrl(key: string | null | undefined, fetchBlob: (key: string) => Promise<Blob>) {
  const { data: blob } = useQuery({
    queryKey: ['blob', key],
    queryFn: () => fetchBlob(key!),
    enabled: Boolean(key),
    staleTime: Infinity,
  })

  return useObjectUrl(blob)
}
