import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { TagChipInput } from './TagChipInput'

vi.mock('@/services/workspaceTags.service', () => ({
  workspaceTagsService: {
    useList: () => ({
      data: [
        { name: 'vip', folder: 'Sales' },
        { name: 'cold', folder: null },
        { name: 'lead', folder: 'Sales' },
      ],
    }),
  },
}))

function Harness({ initial = [] as string[] }) {
  const [tags, setTags] = useState(initial)
  return <TagChipInput id="tag-input" value={tags} onChange={setTags} />
}

describe('TagChipInput', () => {
  it('adds chips, suggests folder-clustered registry names, and ignores duplicates', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const input = screen.getByPlaceholderText('Select or create a new tag')
    const options = [...document.querySelectorAll('datalist option')].map((el) => el.getAttribute('value'))
    expect(options).toEqual(['lead', 'vip', 'cold'])

    await user.type(input, 'vip{Enter}')
    expect(screen.getByText('vip')).toBeInTheDocument()
    expect([...document.querySelectorAll('datalist option')].map((el) => el.getAttribute('value'))).toEqual([
      'lead',
      'cold',
    ])

    await user.type(input, 'vip{Enter}')
    expect(screen.getAllByText('vip')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Remove vip' }))
    expect(screen.queryByText('vip')).not.toBeInTheDocument()
  })
})
