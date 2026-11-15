export const formatNumber = (value: number) =>
  new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(value)

export function xpForNextLevel(level: number) {
  return totalXpForLevel(level + 1) - totalXpForLevel(level)
}

export function totalXpForLevel(level: number) {
  const safeLevel = Math.max(1, level)
  const raw = (50 * (1.11 ** (safeLevel - 1) - 1)) / 0.11
  // La tabla publicada usa redondeo al entero más cercano; el epsilon conserva
  // el caso histórico de nivel 3 (105 XP) pese a la representación de flotantes.
  return Math.floor(raw + 0.499999)
}

export function levelForXp(xp: number) {
  let level = 1
  let total = 0
  while (level < 500 && total + xpForNextLevel(level) <= xp) {
    total += xpForNextLevel(level)
    level += 1
  }
  return level
}

export type FightStyle = 'controlled' | 'accurate' | 'aggressive' | 'defensive' | 'cordial'

export function combatXp(health: number, style: FightStyle, doubleXp = false) {
  const multiplier = doubleXp ? 2 : 1
  const result = { accuracy: 0, strength: 0, defense: 0, health: 0, total: 0 }
  if (style === 'controlled') {
    result.accuracy = (health * 2) / 3
    result.strength = (health * 2) / 3
    result.defense = (health * 2) / 3
    result.health = health
  } else if (style === 'cordial') {
    result.health = health * 2
  } else {
    const styleSkills: Record<'accurate' | 'aggressive' | 'defensive', 'accuracy' | 'strength' | 'defense'> = {
      accurate: 'accuracy', aggressive: 'strength', defensive: 'defense',
    }
    const skill = styleSkills[style]
    result[skill] = health * 2
    result.health = health
  }
  result.accuracy *= multiplier
  result.strength *= multiplier
  result.defense *= multiplier
  result.health *= multiplier
  result.total = result.accuracy + result.strength + result.defense + result.health
  return result
}
