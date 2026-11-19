import { describe, it, expect } from 'vitest'
import {
  DISCOUNT_TYPE_COLUMNS,
  STUDENT_DISCOUNT_COLUMNS,
  buildDiscountTypeDeactivateMessage,
  buildDiscountTypeDeleteMessage,
  buildDiscountTypeOptionLabel,
  buildDiscountTypeReactivateMessage,
  buildStudentDiscountRemoveMessage,
  formatDiscountBase,
  formatDiscountStages,
  formatDiscountValue,
  formatReferenceNo,
  formatStudentDiscountGradeLevel,
  getSourceChip,
} from '@/utils/discountDisplay.js'

describe('discountDisplay', () => {
  it('lists the type columns', () => {
    expect(DISCOUNT_TYPE_COLUMNS.map((column) => column.key)).toEqual([
      'name',
      'source',
      'value',
      'base',
      'stages',
      'is_active',
    ])
  })

  it('lists the student discount columns', () => {
    expect(STUDENT_DISCOUNT_COLUMNS.map((column) => column.key)).toEqual([
      'student',
      'grade_level',
      'discount_type',
      'source',
      'value',
      'reference_no',
    ])
  })

  it('formats fixed and percent values', () => {
    expect(formatDiscountValue({ value_type: 'fixed', value: '1500.00' })).toBe('₱1,500.00')
    expect(formatDiscountValue({ value_type: 'percent', value: '12.50' })).toBe('12.5%')
    expect(formatDiscountValue({ value_type: 'percent', value: '100.00' })).toBe('100%')
  })

  it('falls back to a dash for an unusable value', () => {
    expect(formatDiscountValue({ value_type: 'other', value: '1' })).toBe('—')
    expect(formatDiscountValue(null)).toBe('—')
    expect(formatDiscountValue({ value_type: 'fixed', value: 'abc' })).toBe('—')
  })

  it('formats the base', () => {
    expect(formatDiscountBase('tuition')).toBe('Tuition')
    expect(formatDiscountBase('total')).toBe('Total')
    expect(formatDiscountBase('x')).toBe('—')
    expect(formatDiscountBase(null)).toBe('—')
  })

  it('formats stages in canonical order', () => {
    expect(formatDiscountStages(['jhs'])).toBe('JHS')
    expect(formatDiscountStages(['shs', 'jhs'])).toBe('JHS, SHS')
    expect(formatDiscountStages([])).toBe('—')
    expect(formatDiscountStages(null)).toBe('—')
    expect(formatDiscountStages(['x'])).toBe('x')
  })

  it('builds source chips', () => {
    expect(getSourceChip('government')).toEqual({ label: 'Government', colorClass: 'bg-accent-soft text-accent' })
    expect(getSourceChip('school')).toEqual({ label: 'School', colorClass: 'bg-slate-200 text-slate-700' })
    expect(getSourceChip('other')).toEqual({ label: 'other', colorClass: 'bg-slate-200 text-slate-700' })
    expect(getSourceChip(null).label).toBe('—')
  })

  it('formats grade level and reference no.', () => {
    expect(formatStudentDiscountGradeLevel({ grade_level: { name: 'Grade 8' } })).toBe('Grade 8')
    expect(formatStudentDiscountGradeLevel({ grade_level: null })).toBe('—')
    expect(formatReferenceNo('  R-1 ')).toBe('R-1')
    expect(formatReferenceNo('  ')).toBe('—')
    expect(formatReferenceNo(null)).toBe('—')
  })

  it('labels discount type options', () => {
    const active = { name: 'ESC', value_type: 'fixed', value: '500.00', is_active: true }
    expect(buildDiscountTypeOptionLabel(active)).toBe('ESC · ₱500.00')
    expect(buildDiscountTypeOptionLabel({ ...active, is_active: false })).toBe('ESC · ₱500.00 (inactive)')
  })

  it('builds the dialog texts', () => {
    const type = { name: 'ESC' }
    const discount = {
      discount_type: { name: 'ESC' },
      student: { first_name: 'Ana', middle_name: null, last_name: 'Cruz' },
    }
    expect(buildDiscountTypeDeactivateMessage(type)).toBe(
      'Deactivate ESC? Students who hold it keep it, but it cannot be assigned until reactivated.',
    )
    expect(buildDiscountTypeReactivateMessage(type)).toBe('Reactivate ESC? It can be assigned again.')
    expect(buildDiscountTypeDeleteMessage(type)).toBe('Delete the ESC discount type? This cannot be undone.')
    expect(buildStudentDiscountRemoveMessage(discount)).toBe('Remove ESC from Cruz, Ana?')
    expect(buildDiscountTypeDeleteMessage(null)).toBe('')
    expect(buildStudentDiscountRemoveMessage(null)).toBe('')
  })
})
