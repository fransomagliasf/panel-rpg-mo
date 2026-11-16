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
  level: number
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

export type MapArea = {
  name: string
  image?: string
  href?: string
  coords: string
}

export type MapResourceLocation = {
  zone: string
  label?: string
  coords?: string
  count?: number
  optimal?: boolean
}

export type MapResource = {
  id: string
  name: string
  type: 'Pesca' | 'Fungicultura'
  itemId?: number
  level?: string
  locations: MapResourceLocation[]
}

export type MapData = {
  worldImage: string
  areas: MapArea[]
  resources: MapResource[]
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
  counts: { items: number; mobs: number; recipes: number; mapAreas?: number; resources?: number }
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
