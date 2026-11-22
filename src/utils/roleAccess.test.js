import { describe, it, expect } from 'vitest'
import {
  EMPLOYEE_ROLES,
  STAFF_ROLES,
  findLandingRouteName,
  hasAnyAllowedRole,
} from '@/utils/roleAccess.js'

describe('role lists', () => {
  it('keeps the staff roles unchanged and adds teacher to the employee roles', () => {
    expect(STAFF_ROLES).toEqual(['admin', 'registrar', 'cashier'])
    expect(EMPLOYEE_ROLES).toEqual(['admin', 'registrar', 'cashier', 'teacher'])
  })
})

describe('findLandingRouteName', () => {
  it('lands each single role on its page', () => {
    expect(findLandingRouteName(['admin'])).toBe('Dashboard')
    expect(findLandingRouteName(['registrar'])).toBe('Students')
    expect(findLandingRouteName(['cashier'])).toBe('Payments')
    expect(findLandingRouteName(['teacher'])).toBe('TeacherHome')
  })

  it('keeps the staff landing when a teacher also holds another role', () => {
    expect(findLandingRouteName(['teacher', 'registrar'])).toBe('Students')
    expect(findLandingRouteName(['teacher', 'admin'])).toBe('Dashboard')
  })

  it('returns null without a known role or a list', () => {
    expect(findLandingRouteName([])).toBeNull()
    expect(findLandingRouteName(['janitor'])).toBeNull()
    expect(findLandingRouteName(null)).toBeNull()
  })
})

describe('hasAnyAllowedRole', () => {
  it('matches any allowed role and refuses empty or non-array input', () => {
    expect(hasAnyAllowedRole(['teacher', 'registrar'], ['admin', 'registrar'])).toBe(true)
    expect(hasAnyAllowedRole(['teacher'], ['admin', 'registrar'])).toBe(false)

    expect(hasAnyAllowedRole(['admin'], [])).toBe(false)
    expect(hasAnyAllowedRole(['admin'], undefined)).toBe(false)

    expect(hasAnyAllowedRole(null, ['admin'])).toBe(false)
    expect(hasAnyAllowedRole('admin', ['admin'])).toBe(false)
  })
})
