import { describe, it, expect } from 'vitest'
import { buildMoveDownUpdates, buildMoveUpUpdates, isFirstEntry, isLastEntry } from '@/utils/curriculumOrder.js'

function buildEntries(sortOrders) {
  return sortOrders.map((sortOrder, index) => ({ id: index + 1, sort_order: sortOrder }))
}

describe('buildMoveUpUpdates', () => {
  it('swaps the two sort orders when both are distinct integers', () => {
    expect(buildMoveUpUpdates(buildEntries([1, 2, 3]), 2)).toEqual([
      { id: 2, sort_order: 1 },
      { id: 1, sort_order: 2 },
    ])
  })

  it('renumbers only the changed rows when an order is null or two orders are tied', () => {
    expect(buildMoveUpUpdates(buildEntries([1, null, null]), 3)).toEqual([
      { id: 3, sort_order: 2 },
      { id: 2, sort_order: 3 },
    ])
    expect(buildMoveUpUpdates(buildEntries([1, 1]), 2)).toEqual([{ id: 1, sort_order: 2 }])
  })

  it('returns no updates for the first entry or an unknown id', () => {
    expect(buildMoveUpUpdates(buildEntries([1, 2]), 1)).toEqual([])
    expect(buildMoveUpUpdates(buildEntries([1, 2]), 99)).toEqual([])
  })
})

describe('buildMoveDownUpdates', () => {
  it('swaps the two sort orders when both are distinct integers', () => {
    expect(buildMoveDownUpdates(buildEntries([1, 2, 3]), 2)).toEqual([
      { id: 2, sort_order: 3 },
      { id: 3, sort_order: 2 },
    ])
  })

  it('returns no updates for the last entry or an unknown id', () => {
    expect(buildMoveDownUpdates(buildEntries([1, 2]), 2)).toEqual([])
    expect(buildMoveDownUpdates(buildEntries([1, 2]), 99)).toEqual([])
  })
})

describe('isFirstEntry and isLastEntry', () => {
  it('detect the ends of the list', () => {
    const entries = buildEntries([1, 2, 3])
    expect(isFirstEntry(entries, 1)).toBe(true)
    expect(isFirstEntry(entries, 2)).toBe(false)
    expect(isLastEntry(entries, 3)).toBe(true)
    expect(isLastEntry(entries, 2)).toBe(false)
  })
})

describe('move updates', () => {
  it('leave the input array and objects unchanged', () => {
    const entries = buildEntries([1, null, null])
    const snapshot = JSON.parse(JSON.stringify(entries))
    buildMoveUpUpdates(entries, 3)
    buildMoveDownUpdates(entries, 1)
    expect(entries).toEqual(snapshot)
  })
})
