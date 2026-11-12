import { describe, it, expect } from 'vitest'
import {
  ENROLLMENT_STATUSES,
  ENROLLMENT_STATUS_OPTIONS,
  buildClosingConfirm,
  getEnrollmentStatusChip,
  listEnrollmentActions,
} from '@/utils/enrollmentStatus.js'

const ENROLLMENT = Object.freeze({
  status: 'enrolled',
  student: { first_name: 'Ana', middle_name: 'Reyes', last_name: 'Cruz' },
  section: { name: 'A', program: { code: 'STEM' } },
})

describe('ENROLLMENT_STATUS_OPTIONS', () => {
  it('lists the five statuses in order with their labels', () => {
    expect(ENROLLMENT_STATUSES).toEqual(['enrolled', 'moved', 'dropped', 'transferred', 'completed'])
    expect(ENROLLMENT_STATUS_OPTIONS.map((statusOption) => statusOption.label)).toEqual([
      'Enrolled',
      'Moved',
      'Dropped',
      'Transferred',
      'Completed',
    ])
  })
})

describe('getEnrollmentStatusChip', () => {
  it('shows enrolled in green', () => {
    expect(getEnrollmentStatusChip('enrolled')).toEqual({ label: 'Enrolled', colorClass: 'bg-green-100 text-green-800' })
  })

  it('colors the four closed statuses', () => {
    expect(getEnrollmentStatusChip('dropped').colorClass).toBe('bg-red-100 text-red-800')
    expect(getEnrollmentStatusChip('transferred').colorClass).toBe('bg-amber-100 text-amber-800')
    expect(getEnrollmentStatusChip('moved').colorClass).toBe('bg-slate-200 text-slate-700')
    expect(getEnrollmentStatusChip('completed')).toEqual({ label: 'Completed', colorClass: 'bg-slate-200 text-slate-700' })
  })

  it('keeps an unknown status visible as its raw text on the neutral chip', () => {
    expect(getEnrollmentStatusChip('archived')).toEqual({ label: 'archived', colorClass: 'bg-slate-200 text-slate-700' })
    expect(getEnrollmentStatusChip(undefined).label).toBe('')
  })
})

describe('listEnrollmentActions', () => {
  it('offers move, drop, transfer and complete for an enrolled record', () => {
    expect(listEnrollmentActions(ENROLLMENT)).toEqual(['move', 'drop', 'transfer', 'complete'])
  })

  it('offers nothing for each closed status', () => {
    for (const status of ['moved', 'dropped', 'transferred', 'completed']) {
      expect(listEnrollmentActions({ status })).toEqual([])
    }
  })

  it('offers nothing for a non-object or a record without a status', () => {
    expect(listEnrollmentActions(null)).toEqual([])
    expect(listEnrollmentActions({})).toEqual([])
  })
})

describe('buildClosingConfirm', () => {
  it('builds the drop, transfer and complete texts with the student and section names', () => {
    expect(buildClosingConfirm('drop', ENROLLMENT)).toEqual({
      title: 'Drop student',
      confirmLabel: 'Drop',
      message: 'Drop Cruz, Ana R. from A (STEM)? The record closes as dropped and cannot be changed.',
    })
    expect(buildClosingConfirm('transfer', ENROLLMENT)).toEqual({
      title: 'Transfer out',
      confirmLabel: 'Transfer',
      message:
        'Mark Cruz, Ana R. as transferred out of the school? The record in A (STEM) closes and cannot be changed.',
    })
    expect(buildClosingConfirm('complete', ENROLLMENT)).toEqual({
      title: 'Complete enrollment',
      confirmLabel: 'Complete',
      message: 'Mark Cruz, Ana R. as completed in A (STEM)? The record closes and cannot be changed.',
    })
  })

  it('returns null for move and for an unknown action', () => {
    expect(buildClosingConfirm('move', ENROLLMENT)).toBeNull()
    expect(buildClosingConfirm('archive', ENROLLMENT)).toBeNull()
  })
})
