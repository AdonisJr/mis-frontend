import { describe, it, expect } from 'vitest'
import {
  ROLE_CHIP_CLASS,
  buildDeactivateMessage,
  buildPasswordResetMessage,
  buildReactivateMessage,
  getStatusChip,
} from '@/utils/employeeDisplay.js'

const SAMPLE_EMPLOYEE = { name: 'Juan Dela Cruz', email: 'juan.delacruz@example.com' }

describe('getStatusChip', () => {
  it('returns the green Active chip for an active employee', () => {
    expect(getStatusChip(true)).toEqual({ label: 'Active', colorClass: 'bg-green-100 text-green-800' })
  })

  it('returns the neutral slate Inactive chip for an inactive employee', () => {
    expect(getStatusChip(false)).toEqual({ label: 'Inactive', colorClass: 'bg-slate-200 text-slate-700' })
  })
})

describe('ROLE_CHIP_CLASS', () => {
  it('uses the accent-soft pill classes', () => {
    expect(ROLE_CHIP_CLASS).toBe('rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-bold text-accent')
  })
})

describe('buildDeactivateMessage', () => {
  it('names the employee and email and warns they are signed out', () => {
    expect(buildDeactivateMessage(SAMPLE_EMPLOYEE)).toBe(
      'Deactivate Juan Dela Cruz (juan.delacruz@example.com)? They are signed out at once and cannot log in until reactivated.',
    )
  })
})

describe('buildReactivateMessage', () => {
  it('names the employee and email and says they can log in again', () => {
    expect(buildReactivateMessage(SAMPLE_EMPLOYEE)).toBe(
      'Reactivate Juan Dela Cruz (juan.delacruz@example.com)? They can log in again.',
    )
  })
})

describe('buildPasswordResetMessage', () => {
  it('names the employee and says every session ends', () => {
    expect(buildPasswordResetMessage(SAMPLE_EMPLOYEE)).toBe(
      'Set a new password for Juan Dela Cruz. They are signed out of every session and must log in with the new password.',
    )
  })
})

describe('buildDeactivateMessage', () => {
  it('returns an empty string for a missing employee', () => {
    expect(buildDeactivateMessage(null)).toBe('')
    expect(buildReactivateMessage(null)).toBe('')
    expect(buildPasswordResetMessage(null)).toBe('')
  })
})
