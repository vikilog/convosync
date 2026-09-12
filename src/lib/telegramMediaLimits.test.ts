import { describe, expect, it } from 'vitest'

import { mediaKindFromFile, telegramFileSizeError } from './telegramMediaLimits'

describe('telegramFileSizeError', () => {
  it('rejects oversized photos and classifies file kinds', () => {
    const big = new File([new Uint8Array(11 * 1024 * 1024)], 'shot.jpg', { type: 'image/jpeg' })
    expect(telegramFileSizeError(big)).toMatch(/Telegram limits photos/)
    expect(mediaKindFromFile(new File([], 'a.mp3', { type: 'audio/mpeg' }))).toBe('audio')
  })
})
