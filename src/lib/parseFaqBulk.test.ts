import { describe, expect, it } from 'vitest'

import { parseFaqBulk } from './parseFaqBulk'

describe('parseFaqBulk', () => {
  it('parses Q:/A: labeled pairs', () => {
    const labeled = parseFaqBulk(`Q: Hours?
A: 9-6

Q: Shipping?
A: Yes`)
    expect(labeled).toHaveLength(2)
    expect(labeled[0]).toEqual({ question: 'Hours?', answer: '9-6' })
  })

  it('parses blank-line blocks', () => {
    const blocks = parseFaqBulk(`What is refund policy?
7 days full refund.

Where are you based?
Mumbai.`)
    expect(blocks).toHaveLength(2)
    expect(blocks[1].answer).toBe('Mumbai.')
  })

  it('parses CSV including quoted multiline answers', () => {
    const csv = parseFaqBulk(`question,answer
"Do you deliver?","Yes, city-wide"
Hours?,Mon-Fri`)
    expect(csv).toHaveLength(2)

    const csvMultiline = parseFaqBulk('question,answer\n"Return policy?","Line1\nLine2"\nHours?,Mon-Fri')
    expect(csvMultiline).toHaveLength(2)
    expect(csvMultiline[0].answer).toBe('Line1\nLine2')
  })

  it('parses JSON q/a aliases', () => {
    expect(parseFaqBulk(`[{"q":"Hi?","a":"Hello"}]`)[0]).toEqual({ question: 'Hi?', answer: 'Hello' })
  })
})
