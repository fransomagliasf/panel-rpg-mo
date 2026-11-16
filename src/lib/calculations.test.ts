import { describe, expect, it } from 'vitest'
import { combatXp, estimateMobCombat, meleeMaxHit, physicalHitChance, totalXpForLevel, xpForNextLevel } from './calculations'

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

describe('combat estimates', () => {
  it('raises maximum hit with strength and power', () => {
    expect(meleeMaxHit(90, 300)).toBeGreaterThan(meleeMaxHit(50, 100))
  })

  it('lowers hit chance against more defense', () => {
    expect(physicalHitChance(90, 250, 50)).toBeGreaterThan(physicalHitChance(90, 250, 150))
  })

  it('projects more XP per hour against the same health with less defense', () => {
    const input = { accuracyLevel: 90, strengthLevel: 90, aim: 250, power: 250, style: 'accurate' as const, attackSeconds: 2, betweenKillsSeconds: 1 }
    expect(estimateMobCombat(100, 50, input).xpPerHour).toBeGreaterThan(estimateMobCombat(100, 150, input).xpPerHour)
  })
})
