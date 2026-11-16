import type { GameDataMeta, Item, MapData, Mob, PlayerHistory, Recipe } from '../types'

const base = import.meta.env.BASE_URL

async function readJson<T>(file: string): Promise<T> {
  const response = await fetch(`${base}data/${file}`)
  if (!response.ok) throw new Error(`No se pudo cargar ${file}`)
  return response.json() as Promise<T>
}

export const loadItems = () => readJson<Item[]>('items.json')
export const loadMobs = () => readJson<Mob[]>('mobs.json')
export const loadRecipes = () => readJson<Recipe[]>('recipes.json')
export const loadMapData = () => readJson<MapData>('map.json')
export const loadMeta = () => readJson<GameDataMeta>('meta.json')
export const loadPlayerHistory = (player: string) => readJson<PlayerHistory>(`players/${player.toLowerCase()}.json`)
