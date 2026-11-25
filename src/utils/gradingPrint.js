import { buildClassHeaderItems } from '@/utils/classListDisplay.js'
import { buildWeightsText } from '@/utils/classRecordDisplay.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'

export const CLASS_RECORD_PRINT_PAGE_CLASS = 'print-page-class-record'
export const REPORT_CARD_BREAK_CLASS = 'break-after-page'

const HEADER_KEYS_FROM_CLASS = Object.freeze(['school_year', 'section', 'subject', 'teacher'])

function pickHeaderText(headerItems, headerKey) {
  return headerItems.find((headerItem) => headerItem.key === headerKey)?.text ?? NO_VALUE_LABEL
}

function buildQuarterText(quarter) {
  if (quarter === null || quarter === undefined || quarter === '') return NO_VALUE_LABEL
  return `Quarter ${quarter}`
}

export function buildClassRecordPrintHeaderItems(classRecord, quarter) {
  const headerItems = buildClassHeaderItems(classRecord?.class)
  const textByKey = Object.fromEntries(
    HEADER_KEYS_FROM_CLASS.map((headerKey) => [headerKey, pickHeaderText(headerItems, headerKey)]),
  )
  return [
    { key: 'school_year', label: 'School year', text: textByKey.school_year },
    { key: 'quarter', label: 'Quarter', text: buildQuarterText(quarter) },
    { key: 'section', label: 'Section', text: textByKey.section },
    { key: 'subject', label: 'Subject', text: textByKey.subject },
    { key: 'teacher', label: 'Teacher', text: textByKey.teacher },
    { key: 'weights', label: 'Weights', text: buildWeightsText(classRecord?.weights) },
  ]
}
