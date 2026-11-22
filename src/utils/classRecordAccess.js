import { ADMIN_ROLE, REGISTRAR_ROLE, TEACHER_ROLE, hasAnyAllowedRole } from '@/utils/roleAccess.js'

const STATUS_DRAFT = 'draft'
const STATUS_SUBMITTED = 'submitted'
const REOPEN_ROLES = [ADMIN_ROLE, REGISTRAR_ROLE]

function isCurrentTeacher(classRecord, authUser) {
  if (!hasAnyAllowedRole(authUser?.roles, [TEACHER_ROLE])) return false
  const teacherId = classRecord?.class?.teacher?.id
  return teacherId !== undefined && teacherId !== null && teacherId === authUser.id
}

export function buildClassRecordPermissions(classRecord, authUser) {
  const isDraft = classRecord?.status === STATUS_DRAFT
  const isSubmitted = classRecord?.status === STATUS_SUBMITTED
  const canWrite = isDraft && isCurrentTeacher(classRecord, authUser)
  return {
    canEdit: canWrite,
    canSubmit: canWrite,
    canReopen: isSubmitted && hasAnyAllowedRole(authUser?.roles, REOPEN_ROLES),
  }
}
