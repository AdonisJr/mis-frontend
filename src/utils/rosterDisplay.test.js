import { describe, it, expect } from 'vitest'
import {
  GUARDIAN_COLUMNS,
  ROSTER_BASE_COLUMNS,
  buildRosterColumns,
  buildRosterGroups,
  hasGuardianFields,
} from '@/utils/rosterDisplay.js'

function buildRow(overrides) {
  return {
    enrollment_id: 1,
    student_id: 1,
    last_name: 'Cruz',
    first_name: 'Ana',
    middle_name: 'Bautista',
    lrn: '123456789012',
    gender: 'female',
    status: 'enrolled',
    ...overrides,
  }
}

describe('ROSTER_BASE_COLUMNS', () => {
  it('(1) lists the base column keys', () => {
    expect(ROSTER_BASE_COLUMNS.map((column) => column.key)).toEqual(['number', 'name', 'lrn', 'gender', 'status'])
  })
})

describe('hasGuardianFields', () => {
  it('(2) tests key ownership, not truthiness', () => {
    expect(hasGuardianFields({ listedRows: [{ guardian_name: null }], leftRows: [] })).toBe(true)
    expect(hasGuardianFields({ listedRows: [{ name: 'a' }], leftRows: [{ name: 'b' }] })).toBe(false)
    expect(hasGuardianFields({ listedRows: [], leftRows: [{ guardian_name: 'x' }] })).toBe(true)
    expect(hasGuardianFields('x')).toBe(false)
  })
})

describe('buildRosterColumns', () => {
  it('(3) adds the guardian columns after status', () => {
    const guardianKeys = GUARDIAN_COLUMNS.map((column) => column.key)
    expect(buildRosterColumns(true).map((column) => column.key)).toEqual([
      'number',
      'name',
      'lrn',
      'gender',
      'status',
      ...guardianKeys,
    ])
    expect(buildRosterColumns(false)).toEqual([...ROSTER_BASE_COLUMNS])
  })
})

describe('buildRosterGroups partition', () => {
  it('(4) splits by status whichever array a row came in', () => {
    const rosterGroups = buildRosterGroups({
      students: [buildRow({ enrollment_id: 1 }), buildRow({ enrollment_id: 2, status: 'moved' })],
      left_the_class: [
        buildRow({ enrollment_id: 3, status: 'dropped' }),
        buildRow({ enrollment_id: 4, status: 'completed' }),
        buildRow({ enrollment_id: 5, status: 'transferred' }),
      ],
    })
    expect(rosterGroups.listedRows.map((row) => row.key).sort()).toEqual([1, 4])
    expect(rosterGroups.leftRows.map((row) => row.key).sort()).toEqual([2, 3, 5])
  })
})

describe('buildRosterGroups order', () => {
  it('(5) sorts last, first, middle without mutating the input', () => {
    const students = [
      buildRow({ enrollment_id: 1, last_name: 'Dela Cruz', first_name: 'Al' }),
      buildRow({ enrollment_id: 2, last_name: 'Cruz', first_name: 'Ben' }),
      buildRow({ enrollment_id: 3, last_name: 'cruz', first_name: 'Ana', middle_name: 'Zed' }),
      buildRow({ enrollment_id: 4, last_name: 'cruz', first_name: 'Ana', middle_name: null }),
    ]
    const studentsBefore = JSON.stringify(students)
    const listedKeys = buildRosterGroups({ students }).listedRows.map((row) => row.key)
    expect(listedKeys).toEqual([4, 3, 2, 1])
    expect(JSON.stringify(students)).toBe(studentsBefore)
  })
})

describe('buildRosterGroups numbering', () => {
  it('(6) numbers each group from 1', () => {
    const rosterGroups = buildRosterGroups({
      students: [buildRow({ enrollment_id: 1 }), buildRow({ enrollment_id: 2, last_name: 'Reyes' })],
      left_the_class: [buildRow({ enrollment_id: 3, status: 'moved' })],
    })
    expect(rosterGroups.listedRows.map((row) => row.number)).toEqual([1, 2])
    expect(rosterGroups.leftRows.map((row) => row.number)).toEqual([1])
  })
})

describe('buildRosterGroups row display', () => {
  it('(7) formats the row and copies guardian keys only when owned', () => {
    const plainRow = buildRosterGroups({ students: [buildRow({})] }).listedRows[0]
    expect(plainRow).toMatchObject({ name: 'Cruz, Ana B.', gender: 'Female', lrn: '123456789012' })
    expect(plainRow.statusChip).toMatchObject({ label: 'Enrolled', colorClass: 'bg-green-100 text-green-800' })
    expect(Object.hasOwn(plainRow, 'guardian_name')).toBe(false)

    const emptyRow = buildRosterGroups({ students: [buildRow({ gender: 'x', lrn: null })] }).listedRows[0]
    expect(emptyRow).toMatchObject({ gender: '—', lrn: '—' })

    const guardianRow = buildRosterGroups({
      students: [buildRow({ guardian_name: 'Maria', guardian_relationship: null, guardian_contact: '0917' })],
    }).listedRows[0]
    expect(guardianRow).toMatchObject({ guardian_name: 'Maria', guardian_relationship: '—', guardian_contact: '0917' })
  })
})

describe('buildRosterGroups with a bad source', () => {
  it('(8) returns empty groups', () => {
    expect(buildRosterGroups(null)).toEqual({ listedRows: [], leftRows: [] })
    expect(buildRosterGroups('x')).toEqual({ listedRows: [], leftRows: [] })
  })
})
