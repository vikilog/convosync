import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { ConfirmDialogProvider, useConfirm } from '@/components/common/ConfirmDialogProvider'

function Consumer() {
  const confirm = useConfirm()
  const [result, setResult] = useState<string>('idle')

  return (
    <div>
      <p>Result: {result}</p>
      <button
        onClick={async () => {
          const ok = await confirm({ title: 'Delete this?', description: 'No undo.' })
          setResult(ok ? 'confirmed' : 'cancelled')
        }}
      >
        Ask
      </button>
    </div>
  )
}

describe('ConfirmDialogProvider', () => {
  it('resolves true when the user confirms', async () => {
    const user = userEvent.setup()
    render(
      <ConfirmDialogProvider>
        <Consumer />
      </ConfirmDialogProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Ask' }))
    expect(await screen.findByText('Delete this?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(await screen.findByText('Result: confirmed')).toBeInTheDocument()
  })

  it('resolves false when the user cancels', async () => {
    const user = userEvent.setup()
    render(
      <ConfirmDialogProvider>
        <Consumer />
      </ConfirmDialogProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Ask' }))
    expect(await screen.findByText('Delete this?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(await screen.findByText('Result: cancelled')).toBeInTheDocument()
  })
})
