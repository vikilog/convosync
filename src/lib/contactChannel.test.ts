import { describe, expect, it } from 'vitest'

import {
  contactHandleLabel,
  displayNameForChannel,
  isSyntheticChannelPhone,
  resolveContactChannel,
} from './contactChannel'

describe('contactChannel', () => {
  it('resolves prefixes', () => {
    expect(resolveContactChannel('ig:alice')).toBe('instagram')
    expect(resolveContactChannel('fb:123')).toBe('messenger')
    expect(resolveContactChannel('tg:99')).toBe('telegram')
    expect(resolveContactChannel('+9198')).toBe('whatsapp')
  })

  it('formats handles', () => {
    expect(contactHandleLabel('ig:alice')).toBe('@alice')
    expect(contactHandleLabel('ig:12345')).toBe('12345')
    expect(contactHandleLabel('fb:page')).toBe('page')
  })

  it('locks synthetic channel phones', () => {
    expect(isSyntheticChannelPhone('ig:alice')).toBe(true)
    expect(isSyntheticChannelPhone('fb:123')).toBe(true)
    expect(isSyntheticChannelPhone('tg:99')).toBe(true)
    expect(isSyntheticChannelPhone('+9198')).toBe(false)
  })

  it('prefixes Instagram display names', () => {
    expect(displayNameForChannel('alice', 'ig:alice')).toBe('@alice')
    expect(displayNameForChannel('@alice', 'ig:alice')).toBe('@alice')
    expect(displayNameForChannel('Alice', '+91')).toBe('Alice')
  })
})
