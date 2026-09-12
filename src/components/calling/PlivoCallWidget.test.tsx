import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const { call } = vi.hoisted(() => ({
  call: {
    ready: true,
    micPermission: 'granted' as const,
    phase: 'ringing-in' as 'idle' | 'ringing-out' | 'ringing-in' | 'active' | 'ended',
    direction: 'inbound' as const,
    remoteNumber: '+913954921186WhatsApp-p1.live.plivo.com',
    remoteName: 'Vikas Swami',
    callUuid: 'call-1',
    muted: false,
    elapsedSeconds: 12,
    error: null,
    call: vi.fn(),
    answer: vi.fn(),
    reject: vi.fn(),
    hangup: vi.fn(),
    toggleMute: vi.fn(),
    dismissError: vi.fn(),
  },
}))

vi.mock('@/lib/plivoCallClient', () => ({
  usePlivoCall: () => call,
}))

import { PlivoCallWidget } from './PlivoCallWidget'

describe('PlivoCallWidget', () => {
  it('renders the incoming sheet with a stripped number', () => {
    call.phase = 'ringing-in'
    render(<PlivoCallWidget />)
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Vikas Swami' })).toBeInTheDocument()
    expect(screen.getByText('+91 3954921186')).toBeInTheDocument()
    expect(screen.getByText('WhatsApp voice')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /answer/i })).toBeInTheDocument()
  })

  it('renders the bottom dock while a call is live', () => {
    call.phase = 'active'
    render(<PlivoCallWidget />)
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByText('Vikas Swami')).toBeInTheDocument()
    expect(screen.getByText(/Live/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hang up' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mute' })).toBeInTheDocument()
  })
})
