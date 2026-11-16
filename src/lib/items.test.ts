import { describe, expect, it } from 'vitest'
import { itemInLevelRange } from './items'
import type { Item } from '../types'

const item = { id: 1, name: 'Test', category: 'Armor', slot: 'Helmet', wearable: true, level: 40, stats: {}, requirements: { Defense: 40 } } satisfies Item

describe('item level filters', () => {
  it('accepts items inside an inclusive range', () => {
    expect(itemInLevelRange(item, '40', '50')).toBe(true)
  })

  it('rejects items outside either boundary', () => {
    expect(itemInLevelRange(item, '41', '')).toBe(false)
    expect(itemInLevelRange(item, '', '39')).toBe(false)
  })

  it('allows items when both boundaries are empty', () => {
    expect(itemInLevelRange(item, '', '')).toBe(true)
  })
})
