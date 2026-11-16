import { describe, expect, it } from 'vitest'
import { dailySnapshots, levelChanges, totalXpFromScore } from './player'
import type { PlayerSnapshot } from '../types'

const snapshot = (capturedAt: string, date: string, accuracy: number): PlayerSnapshot => ({
  capturedAt,
  date,
  boards: [
    { board: 'total_xp', score: 406, position: 1, lastScore: 0, lastPosition: 0 },
    { board: 'accuracy', score: accuracy, position: 1, lastScore: 0, lastPosition: 0 },
  ],
})

describe('player highscore helpers', () => {
  it('converts the official total XP score to experience points', () => {
    expect(totalXpFromScore(406)).toBe(40_600_000)
  })

  it('keeps the latest capture of each day', () => {
    const first = snapshot('2026-11-15T10:00:00Z', '2026-11-15', 91)
    const latest = snapshot('2026-11-15T16:00:00Z', '2026-11-15', 92)
    expect(dailySnapshots([first, latest])).toEqual([latest])
  })

  it('reports skill level gains between captures', () => {
    const previous = snapshot('2026-11-14T16:00:00Z', '2026-11-14', 91)
    const current = snapshot('2026-11-15T16:00:00Z', '2026-11-15', 92)
    expect(levelChanges(current, previous)).toEqual([{ board: 'accuracy', change: 1 }])
  })
})
