import { describe, it, expect } from 'vitest'
import {
  EMPLOYEE_ROLE_OPTIONS,
  buildAuthUserFromEmployee,
  buildEmployeePayload,
  buildFormFromEmployee,
  buildPasswordPayload,
  createEmptyEmployeeForm,
  createEmptyPasswordForm,
  findEmployeeFormErrors,
  findPasswordFormErrors,
  toggleRole,
} from '@/utils/employeeForm.js'

const SAMPLE_EMPLOYEE = {
  id: 7,
  name: 'Juan Dela Cruz',
  email: 'juan.delacruz@example.com',
  contact: '09171234567',
  is_active: true,
  roles: ['registrar'],
  created_at: '2026-11-01T08:00:00.000000Z',
  updated_at: '2026-11-02T08:00:00.000000Z',
}

const COMPLETE_ADD_FORM = {
  name: 'Juan Dela Cruz',
  email: 'juan.delacruz@example.com',
  contact: '',
  roles: ['registrar'],
  password: 'password123',
  password_confirmation: 'password123',
}

describe('EMPLOYEE_ROLE_OPTIONS', () => {
  it('offers admin and registrar with Admin and Registrar labels', () => {
    expect(EMPLOYEE_ROLE_OPTIONS).toEqual([
      { value: 'admin', label: 'Admin' },
      { value: 'registrar', label: 'Registrar' },
    ])
  })
})

describe('createEmptyEmployeeForm', () => {
  it('returns empty name, email, contact and passwords with no roles', () => {
    expect(createEmptyEmployeeForm()).toEqual({
      name: '',
      email: '',
      contact: '',
      roles: [],
      password: '',
      password_confirmation: '',
    })
  })
})

describe('createEmptyPasswordForm', () => {
  it('returns an empty password and confirmation', () => {
    expect(createEmptyPasswordForm()).toEqual({ password: '', password_confirmation: '' })
  })
})

describe('buildFormFromEmployee', () => {
  it('copies name, email, contact and roles with blank passwords', () => {
    expect(buildFormFromEmployee(SAMPLE_EMPLOYEE)).toEqual({
      name: 'Juan Dela Cruz',
      email: 'juan.delacruz@example.com',
      contact: '09171234567',
      roles: ['registrar'],
      password: '',
      password_confirmation: '',
    })
  })

  it('turns a null contact into an empty string and never copies id, is_active or timestamps', () => {
    const employeeForm = buildFormFromEmployee({ ...SAMPLE_EMPLOYEE, contact: null })
    expect(employeeForm.contact).toBe('')
    expect(employeeForm).not.toHaveProperty('id')
    expect(employeeForm).not.toHaveProperty('is_active')
    expect(employeeForm).not.toHaveProperty('created_at')
    expect(employeeForm).not.toHaveProperty('updated_at')
  })

  it('copies roles into a new array', () => {
    const sourceEmployee = { ...SAMPLE_EMPLOYEE, roles: ['admin', 'registrar'] }
    const employeeForm = buildFormFromEmployee(sourceEmployee)
    expect(employeeForm.roles).toEqual(['admin', 'registrar'])
    expect(employeeForm.roles).not.toBe(sourceEmployee.roles)
  })
})

describe('findEmployeeFormErrors', () => {
  it('returns no errors for a complete add form', () => {
    expect(findEmployeeFormErrors(COMPLETE_ADD_FORM, true)).toEqual({})
  })

  it('flags name, email, roles and password on an empty add form', () => {
    expect(findEmployeeFormErrors(createEmptyEmployeeForm(), true)).toEqual({
      name: ['Name is required.'],
      email: ['Email is required.'],
      roles: ['Select at least one role.'],
      password: ['Password is required.'],
    })
  })

  it('treats whitespace-only name and email as missing', () => {
    const formErrors = findEmployeeFormErrors({ ...COMPLETE_ADD_FORM, name: '   ', email: '\t' }, true)
    expect(formErrors).toEqual({ name: ['Name is required.'], email: ['Email is required.'] })
  })

  it('requires at least one role', () => {
    expect(findEmployeeFormErrors({ ...COMPLETE_ADD_FORM, roles: [] }, true)).toEqual({
      roles: ['Select at least one role.'],
    })
    expect(findEmployeeFormErrors({ ...COMPLETE_ADD_FORM, roles: ['teacher'] }, true)).toEqual({
      roles: ['Select at least one role.'],
    })
  })

  it('ignores the password fields on edit', () => {
    const editForm = { ...COMPLETE_ADD_FORM, password: '', password_confirmation: 'mismatch' }
    expect(findEmployeeFormErrors(editForm, false)).toEqual({})
  })
})

describe('findPasswordFormErrors', () => {
  it('flags a missing password as required', () => {
    expect(findPasswordFormErrors(createEmptyPasswordForm())).toEqual({ password: ['Password is required.'] })
  })

  it('rejects a password shorter than 8 characters', () => {
    expect(findPasswordFormErrors({ password: 'short1', password_confirmation: 'short1' })).toEqual({
      password: ['Password must be at least 8 characters.'],
    })
  })

  it('accepts a password of exactly 8 characters with a matching confirmation', () => {
    expect(findPasswordFormErrors({ password: 'abcd1234', password_confirmation: 'abcd1234' })).toEqual({})
  })

  it('flags a confirmation that does not match', () => {
    expect(findPasswordFormErrors({ password: 'password123', password_confirmation: 'password124' })).toEqual({
      password_confirmation: ['Passwords do not match.'],
    })
  })
})

describe('buildEmployeePayload', () => {
  it('trims name, email and contact and sends a blank contact as null', () => {
    const editForm = { ...COMPLETE_ADD_FORM, name: '  Juan Dela Cruz ', email: ' juan.delacruz@example.com ' }
    expect(buildEmployeePayload({ ...editForm, contact: ' 0917 ' }, false)).toEqual({
      name: 'Juan Dela Cruz',
      email: 'juan.delacruz@example.com',
      contact: '0917',
      roles: ['registrar'],
    })
    expect(buildEmployeePayload({ ...editForm, contact: '   ' }, false).contact).toBeNull()
  })

  it('adds password and confirmation unchanged on add', () => {
    const addForm = { ...COMPLETE_ADD_FORM, password: ' pass word ', password_confirmation: ' pass word ' }
    expect(buildEmployeePayload(addForm, true)).toEqual({
      name: 'Juan Dela Cruz',
      email: 'juan.delacruz@example.com',
      contact: null,
      roles: ['registrar'],
      password: ' pass word ',
      password_confirmation: ' pass word ',
    })
  })

  it('never includes password fields on edit even when present', () => {
    const employeePayload = buildEmployeePayload({ ...COMPLETE_ADD_FORM, id: 7, is_active: false }, false)
    expect(Object.keys(employeePayload)).toEqual(['name', 'email', 'contact', 'roles'])
  })

  it('keeps only admin and registrar in option order', () => {
    const editForm = { ...COMPLETE_ADD_FORM, roles: ['registrar', 'teacher', 'admin'] }
    expect(buildEmployeePayload(editForm, false).roles).toEqual(['admin', 'registrar'])
  })
})

describe('buildPasswordPayload', () => {
  it('returns only password and confirmation, untrimmed', () => {
    const passwordValues = { password: '        ', password_confirmation: '        ', extra: 'x' }
    expect(buildPasswordPayload(passwordValues)).toEqual({ password: '        ', password_confirmation: '        ' })
  })
})

describe('toggleRole', () => {
  it('adds a missing role in option order without mutating the input', () => {
    const selectedRoles = ['registrar']
    expect(toggleRole(selectedRoles, 'admin')).toEqual(['admin', 'registrar'])
    expect(selectedRoles).toEqual(['registrar'])
  })

  it('removes a selected role and ignores an unknown role', () => {
    expect(toggleRole(['admin', 'registrar'], 'admin')).toEqual(['registrar'])
    expect(toggleRole(['registrar'], 'teacher')).toEqual(['registrar'])
  })
})

describe('buildAuthUserFromEmployee', () => {
  it('keeps only id, name, email and roles', () => {
    const authUser = buildAuthUserFromEmployee(SAMPLE_EMPLOYEE)
    expect(authUser).toEqual({
      id: 7,
      name: 'Juan Dela Cruz',
      email: 'juan.delacruz@example.com',
      roles: ['registrar'],
    })
    expect(authUser.roles).not.toBe(SAMPLE_EMPLOYEE.roles)
    expect(buildAuthUserFromEmployee(null)).toBeNull()
  })
})
