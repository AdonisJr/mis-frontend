import { describe, it, expect } from 'vitest'
import { applyRoomTypeChange, buildRoomListParams, createRoomFilters } from '@/utils/roomSearch.js'

describe('createRoomFilters', () => {
  it('starts empty on page 1', () => {
    expect(createRoomFilters()).toEqual({ search: '', type: '', status: '', page: 1 })
  })
})

describe('buildRoomListParams', () => {
  it('sends only the page by default', () => {
    expect(buildRoomListParams(createRoomFilters())).toEqual({ page: 1 })
  })

  it('adds the normalized search, type and status', () => {
    const roomFilters = { search: '  Main   bldg ', type: 'laboratory', status: 'inactive', page: 2 }
    expect(buildRoomListParams(roomFilters)).toEqual({ page: 2, search: 'Main bldg', type: 'laboratory', status: 'inactive' })
  })

  it('drops unknown values and falls back to page 1', () => {
    expect(buildRoomListParams({ search: '', type: 'x', status: 'y', page: 0 })).toEqual({ page: 1 })
  })
})

describe('applyRoomTypeChange', () => {
  it('keeps a valid type, blanks an unknown one, resets the page and leaves the input unchanged', () => {
    const roomFilters = { search: 'a', type: '', status: '', page: 3 }
    expect(applyRoomTypeChange(roomFilters, 'other')).toEqual({ search: 'a', type: 'other', status: '', page: 1 })
    expect(applyRoomTypeChange(roomFilters, 'nope').type).toBe('')
    expect(roomFilters.page).toBe(3)
  })
})
