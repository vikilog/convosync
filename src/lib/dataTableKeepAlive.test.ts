import { describe, expect, it } from 'vitest'

import { readDetailAlive, readListAlive, writeDetailAlive, writeListAlive } from './dataTableKeepAlive'

describe('dataTableKeepAlive', () => {
  it('round-trips list and detail snapshots', () => {
    writeListAlive({ query: 'book' })
    expect(readListAlive()).toEqual({ query: 'book' })

    writeDetailAlive('t1', {
      query: 'amy',
      pageSize: 50,
      hiddenColumnIds: ['c1'],
      sortKey: 'name',
      sortDir: 'desc',
    })
    expect(readDetailAlive('t1')).toEqual({
      query: 'amy',
      pageSize: 50,
      hiddenColumnIds: ['c1'],
      sortKey: 'name',
      sortDir: 'desc',
    })
    expect(readDetailAlive('missing').pageSize).toBe(20)
  })
})
