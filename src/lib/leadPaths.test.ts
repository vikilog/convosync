import { describe, expect, it } from 'vitest'

import {
  isLeadsPath,
  leadFunnelIdFromPath,
  pathForConvertSocialComment,
  pathForLeadFunnel,
  pathForLeads,
} from './leadPaths'

describe('leadPaths', () => {
  it('parses funnel ids from /leads/:id', () => {
    expect(leadFunnelIdFromPath('/leads')).toBeNull()
    expect(leadFunnelIdFromPath('/leads/')).toBeNull()
    expect(leadFunnelIdFromPath('/leads/fun_1')).toBe('fun_1')
    expect(leadFunnelIdFromPath('/inbox')).toBeNull()
  })

  it('round-trips encoded funnel ids', () => {
    const path = pathForLeadFunnel('a/b')
    expect(path).toBe('/leads/a%2Fb')
    expect(leadFunnelIdFromPath(path)).toBe('a/b')
  })

  it('detects the leads prefix', () => {
    expect(isLeadsPath('/leads')).toBe(true)
    expect(isLeadsPath('/leads/x')).toBe(true)
    expect(isLeadsPath('/leadsx')).toBe(false)
    expect(pathForLeads()).toBe('/leads')
    expect(pathForConvertSocialComment('c1')).toBe('/leads?fromComment=c1')
  })
})
