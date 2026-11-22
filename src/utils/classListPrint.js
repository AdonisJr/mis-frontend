import { buildClassHeaderItems, formatClassTerm } from '@/utils/classListDisplay.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'

export const PRINT_ROW_CLASS = 'break-inside-avoid'
export const ADVISORY_SUBJECT_TEXT = 'Advisory class (all subjects)'
export const PRINT_HEADER_KEYS = Object.freeze(['school_year', 'term', 'section', 'subject', 'teacher'])

const PRINT_HEADER_LABELS = Object.freeze({
  school_year: 'School year',
  term: 'Term',
  section: 'Section',
  subject: 'Subject',
  teacher: 'Teacher',
})

function pickText(textValue) {
  return typeof textValue === 'string' && textValue.trim() !== '' ? textValue : NO_VALUE_LABEL
}

export function buildClassPrintHeaderItems(classHeader) {
  return buildClassHeaderItems(classHeader).filter((headerItem) => PRINT_HEADER_KEYS.includes(headerItem.key))
}

export function buildAdvisoryPrintHeaderItems(advisoryBlock, schoolYear) {
  const textByKey = {
    school_year: pickText(schoolYear?.name),
    term: formatClassTerm(advisoryBlock?.termNumber ?? null, schoolYear?.term_type),
    section: pickText(advisoryBlock?.sectionText),
    subject: ADVISORY_SUBJECT_TEXT,
    teacher: pickText(advisoryBlock?.adviserText),
  }
  return PRINT_HEADER_KEYS.map((headerKey) => ({
    key: headerKey,
    label: PRINT_HEADER_LABELS[headerKey],
    text: textByKey[headerKey],
  }))
}
