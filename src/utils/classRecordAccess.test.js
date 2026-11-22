import { describe, it, expect } from 'vitest'
import { buildClassRecordPermissions } from '@/utils/classRecordAccess.js'

const NO_PERMISSIONS = { canEdit: false, canSubmit: false, canReopen: false }

function buildRecord(status) {
  return { status, class: { id: 3, teacher: { id: 5, name: 'Ana Cruz' } } }
}

function buildUser(userId, roles) {
  return { id: userId, roles }
}

describe('buildClassRecordPermissions', () => {
  it('(1) lets the current teacher edit and submit a draft', () => {
    expect(buildClassRecordPermissions(buildRecord('draft'), buildUser(5, ['teacher']))).toEqual({
      canEdit: true,
      canSubmit: true,
      canReopen: false,
    })
  })

  it('(2) gives the current teacher nothing once submitted', () => {
    expect(buildClassRecordPermissions(buildRecord('submitted'), buildUser(5, ['teacher']))).toEqual(NO_PERMISSIONS)
  })

  it('(3) lets admin and registrar reopen only a submitted record', () => {
    const reopenOnly = { canEdit: false, canSubmit: false, canReopen: true }
    expect(buildClassRecordPermissions(buildRecord('submitted'), buildUser(1, ['admin']))).toEqual(reopenOnly)
    expect(buildClassRecordPermissions(buildRecord('submitted'), buildUser(2, ['registrar']))).toEqual(reopenOnly)
    expect(buildClassRecordPermissions(buildRecord('draft'), buildUser(1, ['admin']))).toEqual(NO_PERMISSIONS)
  })

  it('(4) leaves an adviser teacher with another id read-only', () => {
    expect(buildClassRecordPermissions(buildRecord('draft'), buildUser(8, ['teacher']))).toEqual(NO_PERMISSIONS)
  })

  it('(5) combines the teacher and registrar rights for a user holding both roles', () => {
    const bothRoles = buildUser(5, ['teacher', 'registrar'])
    expect(buildClassRecordPermissions(buildRecord('draft'), bothRoles)).toEqual({
      canEdit: true,
      canSubmit: true,
      canReopen: false,
    })
    expect(buildClassRecordPermissions(buildRecord('submitted'), bothRoles)).toEqual({
      canEdit: false,
      canSubmit: false,
      canReopen: true,
    })
  })

  it('(6) gives nothing for a missing user or record', () => {
    expect(buildClassRecordPermissions(buildRecord('draft'), null)).toEqual(NO_PERMISSIONS)
    expect(buildClassRecordPermissions(null, buildUser(5, ['teacher']))).toEqual(NO_PERMISSIONS)
  })
})
