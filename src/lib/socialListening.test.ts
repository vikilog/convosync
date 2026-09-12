import { describe, expect, it } from 'vitest'

import {
  commenterKey,
  findComment,
  facebookPostToMedia,
  LOW_CONFIDENCE_THRESHOLD,
  priorityRank,
  sortByNewest,
  triageSectionFor,
} from './socialListening'
import { primaryActionFor, primaryActionForComment } from '@/components/social-listening/intentConfig'

describe('triageSectionFor', () => {
  it('buckets by intent when confidence is high', () => {
    expect(triageSectionFor('Complaint', 0.9)).toBe('complaints')
    expect(triageSectionFor('Interested', 0.88)).toBe('sales')
    expect(triageSectionFor('Question', 0.8)).toBe('questions')
  })

  it('sends low-confidence and spam/neutral to unclear', () => {
    expect(triageSectionFor('Complaint', LOW_CONFIDENCE_THRESHOLD - 0.01)).toBe('low_confidence')
    expect(triageSectionFor('Spam', 0.9)).toBe('low_confidence')
    expect(triageSectionFor('Neutral', 0.9)).toBe('low_confidence')
  })
})

describe('sortByNewest / priorityRank', () => {
  it('sorts newest first', () => {
    const a = { createdAt: '2026-01-01T00:00:00.000Z' }
    const b = { createdAt: '2026-01-02T00:00:00.000Z' }
    expect(sortByNewest(a, b)).toBeGreaterThan(0)
    expect(sortByNewest(b, a)).toBeLessThan(0)
  })

  it('ranks complaints above sales', () => {
    expect(priorityRank('complaints')).toBeLessThan(priorityRank('sales'))
  })
})

describe('primaryActionFor', () => {
  it('maps triage sections to queue actions', () => {
    expect(primaryActionFor('sales').kind).toBe('approve_dm')
    expect(primaryActionFor('questions').kind).toBe('approve_reply')
    expect(primaryActionFor('complaints').kind).toBe('escalate')
    expect(primaryActionFor('low_confidence').kind).toBe('review')
  })

  it('returns ignore_only for classified spam/neutral', () => {
    const action = primaryActionForComment({
      intentLabel: 'Spam',
      confidence: 0.9,
      classificationStatus: 'classified',
      status: 'new',
    })
    expect(action?.kind).toBe('ignore_only')
  })

  it('skips already-handled comments', () => {
    expect(
      primaryActionForComment({
        intentLabel: 'Question',
        confidence: 0.9,
        classificationStatus: 'classified',
        status: 'replied',
      }),
    ).toBeNull()
  })
})

describe('comment helpers', () => {
  it('keys commenters by fromId then username', () => {
    expect(commenterKey({ id: '1', fromId: 'ig-9', username: 'a' })).toBe('id:ig-9')
    expect(commenterKey({ id: '1', username: 'Ada' })).toBe('u:ada')
  })

  it('finds nested replies', () => {
    const tree = [{ id: 'a', text: '', username: null, timestamp: null, likeCount: null, fromId: null, replies: [{ id: 'b', text: '', username: null, timestamp: null, likeCount: null, fromId: null, replies: [] }] }]
    expect(findComment(tree, 'b')?.id).toBe('b')
    expect(findComment(tree, 'missing')).toBeNull()
  })

  it('maps a Facebook post into listening media', () => {
    const media = facebookPostToMedia({
      id: 'p1',
      message: 'hello',
      fullPicture: 'https://img',
      createdTime: '2026-01-01',
      likesCount: 3,
      commentsCount: 2,
      sharesCount: 0,
      permalink: 'https://fb',
    })
    expect(media.caption).toBe('hello')
    expect(media.mediaUrl).toBe('https://img')
    expect(media.isReel).toBe(false)
  })
})
