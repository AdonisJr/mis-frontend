import { BASE_TOTAL, BASE_TUITION, DISCOUNT_STAGES, SOURCE_GOVERNMENT, SOURCE_SCHOOL } from '@/utils/discountTypeForm.js'
import { formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'
import { formatPeso } from '@/utils/moneyDisplay.js'
import { formatPercent } from '@/utils/paymentPlanDisplay.js'
import { VALUE_TYPE_FIXED, VALUE_TYPE_PERCENT } from '@/utils/paymentPlanForm.js'
import { getStageLabel } from '@/utils/programDisplay.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'

function freezeColumns(columns) {
  return Object.freeze(columns.map((column) => Object.freeze(column)))
}

export const DISCOUNT_TYPE_COLUMNS = freezeColumns([
  { key: 'name', label: 'Name' },
  { key: 'source', label: 'Source' },
  { key: 'value', label: 'Value' },
  { key: 'base', label: 'Base' },
  { key: 'stages', label: 'Stages' },
  { key: 'is_active', label: 'Status' },
])

export const STUDENT_DISCOUNT_COLUMNS = freezeColumns([
  { key: 'student', label: 'Student' },
  { key: 'grade_level', label: 'Grade level' },
  { key: 'discount_type', label: 'Discount type' },
  { key: 'source', label: 'Source' },
  { key: 'value', label: 'Value' },
  { key: 'reference_no', label: 'Reference no.' },
])

const NEUTRAL_CHIP_CLASS = 'bg-slate-200 text-slate-700'
const BASE_LABELS = Object.freeze({ [BASE_TUITION]: 'Tuition', [BASE_TOTAL]: 'Total' })
const INACTIVE_SUFFIX = ' (inactive)'
const STAGE_SEPARATOR = ', '

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

export function formatDiscountValue(discountType) {
  if (discountType?.value_type === VALUE_TYPE_FIXED) return formatPeso(discountType.value)
  if (discountType?.value_type === VALUE_TYPE_PERCENT) return formatPercent(discountType.value)
  return NO_VALUE_LABEL
}

export function formatDiscountBase(base) {
  return BASE_LABELS[base] ?? NO_VALUE_LABEL
}

export function formatDiscountStages(stages) {
  if (!Array.isArray(stages) || stages.length === 0) return NO_VALUE_LABEL
  const knownStages = DISCOUNT_STAGES.filter((stage) => stages.includes(stage))
  const unknownStages = stages.filter((stage) => !DISCOUNT_STAGES.includes(stage))
  return [...knownStages, ...unknownStages].map(getStageLabel).join(STAGE_SEPARATOR)
}

export function getSourceChip(source) {
  if (source === SOURCE_GOVERNMENT) return { label: 'Government', colorClass: 'bg-accent-soft text-accent' }
  if (source === SOURCE_SCHOOL) return { label: 'School', colorClass: NEUTRAL_CHIP_CLASS }
  const label = typeof source === 'string' && source !== '' ? source : NO_VALUE_LABEL
  return { label, colorClass: NEUTRAL_CHIP_CLASS }
}

export function formatStudentDiscountGradeLevel(studentDiscount) {
  return studentDiscount?.grade_level?.name ?? NO_VALUE_LABEL
}

export function formatReferenceNo(referenceNo) {
  if (typeof referenceNo !== 'string' || referenceNo.trim() === '') return NO_VALUE_LABEL
  return referenceNo.trim()
}

export function buildDiscountTypeOptionLabel(discountType) {
  const label = `${discountType?.name} · ${formatDiscountValue(discountType)}`
  return discountType?.is_active === true ? label : `${label}${INACTIVE_SUFFIX}`
}

export function buildDiscountTypeDeactivateMessage(discountType) {
  if (!isRecordObject(discountType)) return ''
  return `Deactivate ${discountType.name}? Students who hold it keep it, but it cannot be assigned until reactivated.`
}

export function buildDiscountTypeReactivateMessage(discountType) {
  if (!isRecordObject(discountType)) return ''
  return `Reactivate ${discountType.name}? It can be assigned again.`
}

export function buildDiscountTypeDeleteMessage(discountType) {
  if (!isRecordObject(discountType)) return ''
  return `Delete the ${discountType.name} discount type? This cannot be undone.`
}

export function buildStudentDiscountRemoveMessage(studentDiscount) {
  if (!isRecordObject(studentDiscount)) return ''
  const studentName = formatEnrollmentStudentName(studentDiscount.student)
  return `Remove ${studentDiscount.discount_type?.name} from ${studentName}?`
}
