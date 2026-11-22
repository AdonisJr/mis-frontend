import { describe, it, expect } from 'vitest'
import {
  ROOM_COLUMNS,
  ROOM_TYPES,
  ROOM_TYPE_OPTIONS,
  buildRoomDeactivateMessage,
  buildRoomOptionLabel,
  buildRoomReactivateMessage,
  formatRoomBuilding,
  formatRoomCapacity,
  getRoomTypeLabel,
} from '@/utils/roomDisplay.js'

describe('room types', () => {
  it('lists classroom, laboratory and other with their labels', () => {
    expect(ROOM_TYPES).toEqual(['classroom', 'laboratory', 'other'])
    expect(ROOM_TYPE_OPTIONS).toEqual([
      { value: 'classroom', label: 'Classroom' },
      { value: 'laboratory', label: 'Laboratory' },
      { value: 'other', label: 'Other' },
    ])
  })
})

describe('getRoomTypeLabel', () => {
  it('maps a known type, keeps an unknown one and blanks a non-string', () => {
    expect(getRoomTypeLabel('laboratory')).toBe('Laboratory')
    expect(getRoomTypeLabel('office')).toBe('office')
    expect(getRoomTypeLabel(null)).toBe('')
  })
})

describe('formatRoomBuilding and formatRoomCapacity', () => {
  it('shows the value or a dash', () => {
    expect(formatRoomBuilding({ building: 'Main' })).toBe('Main')
    expect(formatRoomBuilding({ building: null })).toBe('—')
    expect(formatRoomCapacity({ capacity: 40 })).toBe('40')
    expect(formatRoomCapacity({ capacity: null })).toBe('—')
    expect(formatRoomCapacity({ capacity: 0 })).toBe('—')
  })
})

describe('buildRoomOptionLabel', () => {
  it('shows name and building and marks inactive rooms', () => {
    expect(buildRoomOptionLabel({ name: 'Rm 101', building: 'Main', is_active: true })).toBe('Rm 101 · Main')
    expect(buildRoomOptionLabel({ name: 'Rm 101', building: 'Main', is_active: false })).toBe('Rm 101 · Main (inactive)')
    expect(buildRoomOptionLabel({ name: 'Lab 1', building: null, is_active: true })).toBe('Lab 1')
    expect(buildRoomOptionLabel(null)).toBe('')
  })
})

describe('room status messages', () => {
  it('names the room and explains the effect', () => {
    expect(buildRoomDeactivateMessage({ name: 'Rm 101' })).toBe(
      'Deactivate room Rm 101? It stays in the list and on its sections, but it cannot be picked for a section.',
    )
    expect(buildRoomReactivateMessage({ name: 'Rm 101' })).toBe('Reactivate room Rm 101? It can be picked for sections again.')
    expect(buildRoomDeactivateMessage(null)).toBe('')
    expect(buildRoomReactivateMessage(null)).toBe('')
  })
})

describe('ROOM_COLUMNS', () => {
  it('lists name, building, capacity, type and status in order', () => {
    expect(ROOM_COLUMNS.map((column) => column.key)).toEqual(['name', 'building', 'capacity', 'type', 'is_active'])
  })
})
