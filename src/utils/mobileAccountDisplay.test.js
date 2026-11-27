import { describe, it, expect } from 'vitest'
import {
  GENERATE_ACTIVE_YEAR_HINT,
  GENERATE_PICK_SECTION_HINT,
  SLIP_INSTRUCTIONS,
  buildGenerateConfirmMessage,
  buildGenerateResultText,
  buildMobileAccountConfirm,
  buildSlipContext,
  buildSlipFieldLines,
  buildSlipRows,
  buildStudentAccountEntry,
  getGenerateAvailability,
  getMobileAccountStatusChip,
  listMobileAccountActions,
} from '@/utils/mobileAccountDisplay.js'

const STUDENT = { lrn: '136512340001', last_name: 'Dela Cruz', first_name: 'Andrea', middle_name: 'Mendoza' }
const STUDENT_NAME = 'Dela Cruz, Andrea M.'
const SLIP_CONTEXT = { sectionLabel: 'Grade 7 · Rizal', schoolYearName: '2026-2027' }

describe('getMobileAccountStatusChip', () => {
  it('maps the four statuses to words and colors', () => {
    expect(getMobileAccountStatusChip('none').label).toBe('No account')
    expect(getMobileAccountStatusChip('active').label).toBe('Active')
    expect(getMobileAccountStatusChip('inactive').label).toBe('Inactive')
    expect(getMobileAccountStatusChip('must_change_password')).toEqual({
      label: 'Must change password',
      colorClass: 'bg-amber-100 text-amber-800',
    })
  })

  it('falls back to Unknown', () => {
    expect(getMobileAccountStatusChip('weird').label).toBe('Unknown')
  })
})

describe('listMobileAccountActions', () => {
  it('offers Create when there is no account', () => {
    expect(listMobileAccountActions('none')).toEqual(['create'])
  })

  it('offers reset and deactivate for active and must-change accounts', () => {
    expect(listMobileAccountActions('active')).toEqual(['reset', 'deactivate'])
    expect(listMobileAccountActions('must_change_password')).toEqual(['reset', 'deactivate'])
  })

  it('offers reset and reactivate for an inactive account', () => {
    expect(listMobileAccountActions('inactive')).toEqual(['reset', 'reactivate'])
  })

  it('offers nothing for an unknown status', () => {
    expect(listMobileAccountActions('weird')).toEqual([])
  })
})

describe('buildMobileAccountConfirm', () => {
  it('builds the reset confirm', () => {
    expect(buildMobileAccountConfirm('reset', STUDENT_NAME)).toEqual({
      title: 'Reset mobile password',
      message: `Give ${STUDENT_NAME} a new temporary password? The old password stops working and the student is signed out of the app.`,
      confirmLabel: 'Reset password',
      isDestructive: false,
    })
  })

  it('builds a destructive deactivate confirm', () => {
    expect(buildMobileAccountConfirm('deactivate', STUDENT_NAME)).toEqual({
      title: 'Deactivate mobile account',
      message: `Deactivate the mobile account of ${STUDENT_NAME}? The student is signed out and cannot log in until it is reactivated.`,
      confirmLabel: 'Deactivate',
      isDestructive: true,
    })
  })

  it('builds the reactivate confirm', () => {
    expect(buildMobileAccountConfirm('reactivate', STUDENT_NAME)).toEqual({
      title: 'Reactivate mobile account',
      message: `Reactivate the mobile account of ${STUDENT_NAME}? The student can log in again with the current password.`,
      confirmLabel: 'Reactivate',
      isDestructive: false,
    })
  })

  it('returns null for create and unknown actions', () => {
    expect(buildMobileAccountConfirm('create', STUDENT_NAME)).toBeNull()
    expect(buildMobileAccountConfirm('weird', STUDENT_NAME)).toBeNull()
  })
})

describe('slip builders', () => {
  it('builds a student account entry in the section response shape', () => {
    expect(buildStudentAccountEntry(STUDENT, 'Kx7mQ4pa')).toEqual({
      lrn: '136512340001',
      name: STUDENT_NAME,
      temporary_password: 'Kx7mQ4pa',
    })
  })

  it('replaces blank context values with the no-value label', () => {
    expect(buildSlipContext('', undefined)).toEqual({ sectionLabel: '—', schoolYearName: '—' })
    expect(buildSlipContext('Grade 7 · Rizal', '2026-2027')).toEqual(SLIP_CONTEXT)
  })

  it('maps accounts to slip rows keyed by LRN', () => {
    const accountEntry = buildStudentAccountEntry(STUDENT, 'Kx7mQ4pa')
    expect(buildSlipRows([accountEntry], SLIP_CONTEXT)).toEqual([
      {
        key: '136512340001',
        lrn: '136512340001',
        name: STUDENT_NAME,
        temporaryPassword: 'Kx7mQ4pa',
        sectionLabel: 'Grade 7 · Rizal',
        schoolYearName: '2026-2027',
      },
    ])
  })

  it('returns no rows for a non-array', () => {
    expect(buildSlipRows(undefined, SLIP_CONTEXT)).toEqual([])
    expect(buildSlipRows({}, SLIP_CONTEXT)).toEqual([])
  })

  it('skips entries without a usable password', () => {
    const accounts = [
      { lrn: '1', name: 'A', temporary_password: 'Rt9wHb3e' },
      { lrn: '2', name: 'B' },
      { lrn: '3', name: 'C', temporary_password: '  ' },
      null,
    ]
    expect(buildSlipRows(accounts, SLIP_CONTEXT).map((slipRow) => slipRow.lrn)).toEqual(['1'])
  })

  it('lists the five slip fields in order', () => {
    const [slipRow] = buildSlipRows([buildStudentAccountEntry(STUDENT, 'Kx7mQ4pa')], SLIP_CONTEXT)
    expect(buildSlipFieldLines(slipRow)).toEqual([
      { label: 'Student', value: STUDENT_NAME },
      { label: 'Username (LRN)', value: '136512340001' },
      { label: 'Temporary password', value: 'Kx7mQ4pa' },
      { label: 'Section', value: 'Grade 7 · Rizal' },
      { label: 'School year', value: '2026-2027' },
    ])
  })

  it('keeps three frozen instruction lines', () => {
    expect(Object.isFrozen(SLIP_INSTRUCTIONS)).toBe(true)
    expect(SLIP_INSTRUCTIONS).toHaveLength(3)
  })
})

describe('generate texts', () => {
  it('builds the confirm message', () => {
    expect(buildGenerateConfirmMessage('Grade 7 · Rizal')).toBe(
      'Create mobile accounts for every student currently enrolled in Grade 7 · Rizal who has none? Each temporary password is shown only once.',
    )
  })

  it('reports created and skipped counts', () => {
    expect(buildGenerateResultText({ created_count: 3, skipped_count: 2 })).toBe(
      'Created 3 accounts. Skipped 2 students with an existing account.',
    )
  })

  it('uses singular nouns for one', () => {
    expect(buildGenerateResultText({ created_count: 1, skipped_count: 1 })).toBe(
      'Created 1 account. Skipped 1 student with an existing account.',
    )
  })

  it('reports no new accounts when all were skipped', () => {
    expect(buildGenerateResultText({ created_count: 0, skipped_count: 4 })).toBe(
      'No new accounts. Skipped 4 students with an existing account.',
    )
  })

  it('reports an empty section', () => {
    expect(buildGenerateResultText({ created_count: 0, skipped_count: 0 })).toBe(
      'No students are currently enrolled in this section.',
    )
  })

  it('omits the skipped sentence when nothing was skipped', () => {
    expect(buildGenerateResultText({ created_count: 5, skipped_count: 0 })).toBe('Created 5 accounts.')
  })

  it('treats non-integer counts as zero', () => {
    expect(buildGenerateResultText({ created_count: '3', skipped_count: null })).toBe(
      'No students are currently enrolled in this section.',
    )
    expect(buildGenerateResultText(undefined)).toBe('No students are currently enrolled in this section.')
  })
})

describe('getGenerateAvailability', () => {
  it('enables only a picked section of the active school year, with the matching hint', () => {
    expect(getGenerateAvailability(null, 3)).toEqual({ isEnabled: false, hint: GENERATE_PICK_SECTION_HINT })
    expect(getGenerateAvailability({ id: 5, school_year_id: 2 }, 3)).toEqual({
      isEnabled: false,
      hint: GENERATE_ACTIVE_YEAR_HINT,
    })
    expect(getGenerateAvailability({ id: 5, school_year_id: 3 }, null).isEnabled).toBe(false)
    expect(getGenerateAvailability({ id: 5, school_year_id: 3 }, 3)).toEqual({ isEnabled: true, hint: '' })
  })
})
