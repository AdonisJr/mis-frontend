import { describe, it, expect } from 'vitest'
import {
  SECTION_COLUMNS,
  buildAdviserOptionLabel,
  buildProgramOptionLabel,
  buildRoomLabel,
  buildSectionDeleteMessage,
  formatSectionAdviser,
  formatSectionProgramCode,
  formatSectionRoom,
} from '@/utils/sectionDisplay.js'

const SHS_SECTION = {
  id: 9,
  name: 'STEM 11-A',
  capacity: 40,
  room: { id: 3, name: 'Rm 101', building: 'Main' },
  adviser: { id: 12, name: 'Ana Cruz' },
  grade_level: { id: 5, name: 'Grade 11', stage: 'shs' },
  program: { id: 1, code: 'STEM', name: 'Science, Technology, Engineering and Mathematics' },
}

describe('SECTION_COLUMNS', () => {
  it('lists name, grade level, program, capacity, room and adviser in order', () => {
    expect(SECTION_COLUMNS.map((column) => column.key)).toEqual([
      'name',
      'grade_level',
      'program',
      'capacity',
      'room',
      'adviser',
    ])
  })
})

describe('formatSectionProgramCode', () => {
  it('shows the program code or a dash for a section without a program', () => {
    expect(formatSectionProgramCode(SHS_SECTION)).toBe('STEM')
    expect(formatSectionProgramCode({ ...SHS_SECTION, program: null })).toBe('—')
    expect(formatSectionProgramCode(null)).toBe('—')
  })
})

describe('formatSectionRoom', () => {
  it('shows the room or a dash when it is empty', () => {
    expect(formatSectionRoom(SHS_SECTION)).toBe('Rm 101 · Main')
    expect(formatSectionRoom({ ...SHS_SECTION, room: { id: 3, name: 'Rm 101', building: null } })).toBe('Rm 101')
    expect(formatSectionRoom({ ...SHS_SECTION, room: null })).toBe('—')
  })
})

describe('buildRoomLabel', () => {
  it('shows the name, plus the building when filled', () => {
    expect(buildRoomLabel({ name: 'Rm 101', building: null })).toBe('Rm 101')
    expect(buildRoomLabel({ name: 'Rm 101', building: 'Main' })).toBe('Rm 101 · Main')
    expect(buildRoomLabel({ name: ' Rm 101 ', building: '  ' })).toBe('Rm 101')
    expect(buildRoomLabel(null)).toBe('')
  })
})

describe('formatSectionAdviser', () => {
  it('shows the adviser name or a dash', () => {
    expect(formatSectionAdviser(SHS_SECTION)).toBe('Ana Cruz')
    expect(formatSectionAdviser({ ...SHS_SECTION, adviser: null })).toBe('—')
  })
})

describe('buildAdviserOptionLabel', () => {
  it('shows the name and marks a teacher who is no longer active', () => {
    expect(buildAdviserOptionLabel({ id: 12, name: 'Ana Cruz' })).toBe('Ana Cruz')
    expect(buildAdviserOptionLabel({ id: 12, name: 'Ana Cruz', isUnavailable: true })).toBe(
      'Ana Cruz (not an active teacher)',
    )
    expect(buildAdviserOptionLabel(null)).toBe('')
  })
})

describe('buildProgramOptionLabel', () => {
  it('shows the code and marks inactive programs', () => {
    expect(buildProgramOptionLabel({ code: 'STEM', is_active: true })).toBe('STEM')
    expect(buildProgramOptionLabel({ code: 'GAS', is_active: false })).toBe('GAS (inactive)')
    expect(buildProgramOptionLabel(null)).toBe('')
  })
})

describe('buildSectionDeleteMessage', () => {
  it('names the section and its grade level and warns it cannot be undone', () => {
    expect(buildSectionDeleteMessage(SHS_SECTION)).toBe('Delete section STEM 11-A of Grade 11? This cannot be undone.')
    expect(buildSectionDeleteMessage({ name: 'A' })).toBe('Delete section A? This cannot be undone.')
    expect(buildSectionDeleteMessage(null)).toBe('')
  })
})
