export type Profile = {
  characterName: string
  combatLevel: number
  dailyGoal: number
  doubleXpHours: number
}

export type XpEntry = {
  id: string
  date: string
  skill: string
  startXp: number
  endXp: number
  doubleXp: boolean
  notes: string
}

export type Item = {
  id: number
  name: string
  category: string
  slot: string
  wearable: boolean
  price?: number
  stats: Record<string, number>
  requirements: Record<string, number>
}

export type Mob = {
  id: number
  name: string
  combatLevel: number
  health: number
  accuracy: number
  strength: number
  defense: number
  locations: string[]
}

export type Recipe = {
  id: number
  name: string
  skill: string
  level: number
  xp: number
  minChance: number
  maxChance: number
  station: string
  materials: Array<{ id: number; name: string; count: number }>
}

export type GameDataMeta = {
  generatedAt: string
  sourceRepository: string
  sourceCommit: string
  counts: { items: number; mobs: number; recipes: number }
}

export type PlayerBoard = {
  board: string
  score: number
  position: number
  lastScore: number
  lastPosition: number
}

export type PlayerSnapshot = {
  capturedAt: string
  date: string
  boards: PlayerBoard[]
}

export type PlayerHistory = {
  version: number
  player: string
  timezone: string
  sourceUrl: string
  updatedAt: string
  snapshots: PlayerSnapshot[]
}
