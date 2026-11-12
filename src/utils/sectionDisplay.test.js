import { describe, it, expect } from 'vitest'
import {
  SECTION_COLUMNS,
  buildProgramOptionLabel,
  buildSectionDeleteMessage,
  formatSectionProgramCode,
  formatSectionRoom,
} from '@/utils/sectionDisplay.js'

const SHS_SECTION = {
  id: 9,
  name: 'STEM 11-A',
  capacity: 40,
  room: 'Rm 101',
  grade_level: { id: 5, name: 'Grade 11', stage: 'shs' },
  program: { id: 1, code: 'STEM', name: 'Science, Technology, Engineering and Mathematics' },
}

describe('SECTION_COLUMNS', () => {
  it('lists name, grade level, program, capacity and room in order', () => {
    expect(SECTION_COLUMNS.map((column) => column.key)).toEqual(['name', 'grade_level', 'program', 'capacity', 'room'])
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
    expect(formatSectionRoom(SHS_SECTION)).toBe('Rm 101')
    expect(formatSectionRoom({ ...SHS_SECTION, room: null })).toBe('—')
    expect(formatSectionRoom({ ...SHS_SECTION, room: '  ' })).toBe('—')
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
