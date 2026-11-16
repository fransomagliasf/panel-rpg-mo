import type { Item } from '../types'

export const SET_STORAGE_KEY = 'mo-tracker-set'

export function loadEquippedSelection(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(SET_STORAGE_KEY) || '{}') as Record<string, number>
  } catch {
    return {}
  }
}

export function equippedItems(items: Item[], selection: Record<string, number>) {
  const ids = new Set(Object.values(selection))
  return items.filter((item) => ids.has(item.id))
}

export function sumItemStats(items: Item[]) {
  return items.reduce((total, item) => {
    Object.entries(item.stats).forEach(([name, value]) => { total[name] = (total[name] || 0) + value })
    return total
  }, {} as Record<string, number>)
}
