import { describe, it, expect } from 'vitest'
import {
  EMPLOYEE_STATUS_OPTIONS,
  applyRoleChange,
  applyStatusChange,
  buildEmployeeListParams,
  createEmployeeFilters,
} from '@/utils/employeeSearch.js'

describe('createEmployeeFilters', () => {
  it('starts with an empty search, all roles, all statuses and page 1', () => {
    expect(createEmployeeFilters()).toEqual({ search: '', role: '', status: '', page: 1 })
  })
})

describe('EMPLOYEE_STATUS_OPTIONS', () => {
  it('offers active and inactive with Active and Inactive labels', () => {
    expect(EMPLOYEE_STATUS_OPTIONS).toEqual([
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ])
  })
})

describe('buildEmployeeListParams', () => {
  it('returns only page 1 for empty filters', () => {
    expect(buildEmployeeListParams(createEmployeeFilters())).toEqual({ page: 1 })
  })

  it('includes the normalized search when set', () => {
    const employeeFilters = { ...createEmployeeFilters(), search: '  Juan   Dela  ' }
    expect(buildEmployeeListParams(employeeFilters)).toEqual({ page: 1, search: 'Juan Dela' })
  })

  it('includes role=admin or role=registrar when a role is chosen', () => {
    expect(buildEmployeeListParams({ ...createEmployeeFilters(), role: 'admin' })).toEqual({ page: 1, role: 'admin' })
    expect(buildEmployeeListParams({ ...createEmployeeFilters(), role: 'registrar' })).toEqual({
      page: 1,
      role: 'registrar',
    })
  })

  it('drops the role param for All roles', () => {
    expect(buildEmployeeListParams({ ...createEmployeeFilters(), role: '' })).toEqual({ page: 1 })
  })

  it('includes status=active or status=inactive when a status is chosen', () => {
    expect(buildEmployeeListParams({ ...createEmployeeFilters(), status: 'active' })).toEqual({
      page: 1,
      status: 'active',
    })
    expect(buildEmployeeListParams({ ...createEmployeeFilters(), status: 'inactive' })).toEqual({
      page: 1,
      status: 'inactive',
    })
  })

  it('drops the status param for All statuses', () => {
    expect(buildEmployeeListParams({ ...createEmployeeFilters(), status: '' })).toEqual({ page: 1 })
  })

  it('combines page, search, role and status', () => {
    const employeeFilters = { search: 'Santos', role: 'registrar', status: 'inactive', page: 3 }
    expect(buildEmployeeListParams(employeeFilters)).toEqual({
      page: 3,
      search: 'Santos',
      role: 'registrar',
      status: 'inactive',
    })
  })

  it('drops a whitespace-only search', () => {
    expect(buildEmployeeListParams({ ...createEmployeeFilters(), search: ' \t  ' })).toEqual({ page: 1 })
  })

  it('falls back to page 1 for a non-positive or non-integer page', () => {
    expect(buildEmployeeListParams({ ...createEmployeeFilters(), page: 0 })).toEqual({ page: 1 })
    expect(buildEmployeeListParams({ ...createEmployeeFilters(), page: -2 })).toEqual({ page: 1 })
    expect(buildEmployeeListParams({ ...createEmployeeFilters(), page: 1.5 })).toEqual({ page: 1 })
    expect(buildEmployeeListParams({ ...createEmployeeFilters(), page: '2' })).toEqual({ page: 1 })
    expect(buildEmployeeListParams(null)).toEqual({ page: 1 })
  })
})

describe('applyRoleChange', () => {
  it('sets the role and resets to page 1 without mutating the input', () => {
    const employeeFilters = { search: 'Juan', role: '', status: 'active', page: 4 }
    const nextFilters = applyRoleChange(employeeFilters, 'admin')
    expect(nextFilters).toEqual({ search: 'Juan', role: 'admin', status: 'active', page: 1 })
    expect(employeeFilters).toEqual({ search: 'Juan', role: '', status: 'active', page: 4 })
  })

  it('stores an empty role for non-string input', () => {
    expect(applyRoleChange(createEmployeeFilters(), null).role).toBe('')
    expect(applyRoleChange(createEmployeeFilters(), 7).role).toBe('')
    expect(applyRoleChange(createEmployeeFilters(), ['admin']).role).toBe('')
  })
})

describe('applyStatusChange', () => {
  it('sets the status and resets to page 1 without mutating the input', () => {
    const employeeFilters = { search: '', role: 'registrar', status: '', page: 2 }
    const nextFilters = applyStatusChange(employeeFilters, 'inactive')
    expect(nextFilters).toEqual({ search: '', role: 'registrar', status: 'inactive', page: 1 })
    expect(employeeFilters).toEqual({ search: '', role: 'registrar', status: '', page: 2 })
  })

  it('stores an empty status for non-string input', () => {
    expect(applyStatusChange(createEmployeeFilters(), undefined).status).toBe('')
    expect(applyStatusChange(createEmployeeFilters(), true).status).toBe('')
  })
})
