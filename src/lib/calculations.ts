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

export type CombatEstimateInput = {
  accuracyLevel: number
  strengthLevel: number
  aim: number
  power: number
  style: FightStyle
  attackSeconds: number
  betweenKillsSeconds: number
  doubleXp?: boolean
}

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

export function meleeMaxHit(strengthLevel: number, power: number, style: FightStyle = 'controlled') {
  const styleBonus = style === 'aggressive' ? 1 : style === 'cordial' ? -1 : 0
  const effectiveStrength = Math.max(1, strengthLevel + styleBonus)
  return Math.max(1, Math.floor(0.5 + (effectiveStrength * (Math.max(0, power) + 64)) / 640))
}

export function physicalHitChance(accuracyLevel: number, aim: number, targetDefense: number, style: FightStyle = 'controlled') {
  const styleBonus = style === 'accurate' ? 1 : style === 'cordial' ? -1 : 0
  const attackRoll = Math.max(1, accuracyLevel + styleBonus) * (Math.max(0, aim) + 64)
  const defenseRoll = Math.max(1, targetDefense) * 64
  const chance = attackRoll > defenseRoll
    ? 1 - (defenseRoll + 2) / (2 * (attackRoll + 1))
    : attackRoll / (2 * (defenseRoll + 1))
  return Math.min(0.995, Math.max(0.005, chance))
}

export function estimateMobCombat(health: number, targetDefense: number, input: CombatEstimateInput) {
  const maxHit = meleeMaxHit(input.strengthLevel, input.power, input.style)
  const minHit = 0
  const averageLandedHit = (minHit + maxHit) / 2
  const hitChance = physicalHitChance(input.accuracyLevel, input.aim, targetDefense, input.style)
  const averageDamagePerAttack = Math.max(0.01, averageLandedHit * hitChance)
  const attacks = Math.max(1, health / averageDamagePerAttack)
  const fightSeconds = attacks * Math.max(0.2, input.attackSeconds)
  const cycleSeconds = fightSeconds + Math.max(0, input.betweenKillsSeconds)
  const killsPerHour = 3600 / cycleSeconds
  const xp = combatXp(health, input.style, input.doubleXp)

  return {
    minHit,
    maxHit,
    averageLandedHit,
    hitChance,
    averageDamagePerAttack,
    attacks,
    fightSeconds,
    killsPerHour,
    xpPerKill: xp.total,
    xpPerHour: xp.total * killsPerHour,
  }
}
