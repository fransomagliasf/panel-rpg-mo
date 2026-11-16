import type { Item } from '../types'

export const SET_STORAGE_KEY = 'mo-tracker-set'
export const EQUIPMENT_SLOTS = ['Helmet', 'Cape', 'Chest', 'Pants', 'Gloves', 'Boots', 'Amulet', 'Ring', 'Left Hand', 'Right Hand', 'Pet'] as const
export const SPELL_SLOT_PREFIX = 'Spell '

export function loadEquippedSelection(): Record<string, number> {
  try {
    const stored = JSON.parse(localStorage.getItem(SET_STORAGE_KEY) || '{}') as Record<string, number>
    return Object.fromEntries(Object.entries(stored).filter(([slot]) => EQUIPMENT_SLOTS.includes(slot as typeof EQUIPMENT_SLOTS[number]) || slot.startsWith(SPELL_SLOT_PREFIX)))
  } catch {
    return {}
  }
}

export function equippedItems(items: Item[], selection: Record<string, number>) {
  const ids = new Set(EQUIPMENT_SLOTS.map((slot) => selection[slot]).filter((id): id is number => typeof id === 'number'))
  return items.filter((item) => ids.has(item.id))
}

export function loadedSpells(items: Item[], selection: Record<string, number>) {
  return Object.entries(selection)
    .filter(([slot]) => slot.startsWith(SPELL_SLOT_PREFIX))
    .sort(([a], [b]) => Number(a.slice(SPELL_SLOT_PREFIX.length)) - Number(b.slice(SPELL_SLOT_PREFIX.length)))
    .map(([, id]) => items.find((item) => item.id === id))
    .filter((item): item is Item => Boolean(item))
}

export function sumItemStats(items: Item[]) {
  return items.reduce((total, item) => {
    Object.entries(item.stats).forEach(([name, value]) => { total[name] = (total[name] || 0) + value })
    return total
  }, {} as Record<string, number>)
}
