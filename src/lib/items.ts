import type { Item } from '../types'

export function itemInLevelRange(item: Item, minLevel: string, maxLevel: string) {
  const min = minLevel === '' ? 0 : Math.max(0, Number(minLevel))
  const max = maxLevel === '' ? Number.POSITIVE_INFINITY : Math.max(0, Number(maxLevel))
  return item.level >= min && item.level <= max
}
