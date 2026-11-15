import { describe, expect, it } from 'vitest'
import { combatXp, totalXpForLevel, xpForNextLevel } from './calculations'

describe('RPG MO experience calculations', () => {
  it('matches the documented early level table', () => {
    expect(xpForNextLevel(1)).toBe(50)
    expect(totalXpForLevel(10)).toBe(708)
    expect(totalXpForLevel(50)).toBe(75125)
  })

  it('distributes controlled combat XP', () => {
    expect(combatXp(30, 'controlled')).toEqual({
      accuracy: 20,
      strength: 20,
      defense: 20,
      health: 30,
      total: 90,
    })
  })

  it('applies the 2x multiplier', () => {
    expect(combatXp(10, 'accurate', true).total).toBe(60)
  })
})
