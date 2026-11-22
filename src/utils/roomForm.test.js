import { describe, it, expect } from 'vitest'
import {
  buildFormFromRoom,
  buildRoomPayload,
  createEmptyRoomForm,
  findRoomFormErrors,
} from '@/utils/roomForm.js'

const VALID_FORM = { name: ' RM 101 ', building: ' Main ', capacity: '40', type: 'classroom' }
const WHOLE_MESSAGE = 'Capacity must be a whole number of at least 1.'

describe('createEmptyRoomForm', () => {
  it('starts with empty strings', () => {
    expect(createEmptyRoomForm()).toEqual({ name: '', building: '', capacity: '', type: '' })
  })
})

describe('buildFormFromRoom', () => {
  it('copies a room as strings and falls back to empty values', () => {
    const room = { id: 1, name: 'RM 101', building: null, capacity: 40, type: 'classroom' }
    expect(buildFormFromRoom(room)).toEqual({ name: 'RM 101', building: '', capacity: '40', type: 'classroom' })
    expect(buildFormFromRoom({ ...room, capacity: null }).capacity).toBe('')
    expect(buildFormFromRoom({ ...room, type: 'office' }).type).toBe('')
    expect(buildFormFromRoom(null)).toEqual(createEmptyRoomForm())
  })
})

describe('findRoomFormErrors', () => {
  it('requires a name', () => {
    expect(findRoomFormErrors({ ...VALID_FORM, name: '' }).name).toEqual(['Name is required.'])
    expect(findRoomFormErrors({ ...VALID_FORM, name: '   ' }).name).toEqual(['Name is required.'])
  })

  it('limits the name to 50 characters without changing its case', () => {
    expect(findRoomFormErrors({ ...VALID_FORM, name: 'a'.repeat(50) })).toEqual({})
    expect(findRoomFormErrors({ ...VALID_FORM, name: 'a'.repeat(51) }).name).toEqual([
      'Name must be at most 50 characters.',
    ])
    expect(findRoomFormErrors({ ...VALID_FORM, name: 'rm 101' })).toEqual({})
  })

  it('limits the building to 100 characters and allows it blank', () => {
    expect(findRoomFormErrors({ ...VALID_FORM, building: 'a'.repeat(100) })).toEqual({})
    expect(findRoomFormErrors({ ...VALID_FORM, building: 'a'.repeat(101) }).building).toEqual([
      'Building must be at most 100 characters.',
    ])
    expect(findRoomFormErrors({ ...VALID_FORM, building: '' })).toEqual({})
  })

  it('rejects a capacity that is not a whole number of at least 1', () => {
    for (const capacity of ['0', '-1', '1.5', 'abc']) {
      expect(findRoomFormErrors({ ...VALID_FORM, capacity }).capacity).toEqual([WHOLE_MESSAGE])
    }
  })

  it('allows a blank capacity and caps it at the integer ceiling', () => {
    for (const capacity of ['', '1', '2147483647']) {
      expect(findRoomFormErrors({ ...VALID_FORM, capacity })).toEqual({})
    }
    expect(findRoomFormErrors({ ...VALID_FORM, capacity: '2147483648' }).capacity).toEqual([
      'Capacity must be at most 2147483647.',
    ])
  })

  it('requires a known type', () => {
    for (const type of ['', 'office']) {
      expect(findRoomFormErrors({ ...VALID_FORM, type }).type).toEqual(['Type is required.'])
    }
  })

  it('returns no errors for a valid form', () => {
    expect(findRoomFormErrors(VALID_FORM)).toEqual({})
  })
})

describe('buildRoomPayload', () => {
  it('trims text, turns blanks into null and sends the capacity as a number', () => {
    expect(buildRoomPayload(VALID_FORM)).toEqual({ name: 'RM 101', building: 'Main', capacity: 40, type: 'classroom' })
    const blankPayload = buildRoomPayload({ ...VALID_FORM, building: '  ', capacity: '' })
    expect(blankPayload.building).toBeNull()
    expect(blankPayload.capacity).toBeNull()
    expect(Object.keys(blankPayload)).toEqual(['name', 'building', 'capacity', 'type'])
  })
})
