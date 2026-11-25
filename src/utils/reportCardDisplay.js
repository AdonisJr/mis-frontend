import { formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'
import { buildSubjectText } from '@/utils/classListDisplay.js'

export const DESCRIPTOR_LEGEND = Object.freeze(
  [
    { descriptor: 'Outstanding', range: '90-100' },
    { descriptor: 'Very Satisfactory', range: '85-89' },
    { descriptor: 'Satisfactory', range: '80-84' },
    { descriptor: 'Fairly Satisfactory', range: '75-79' },
    { descriptor: 'Did Not Meet Expectations', range: 'Below 75' },
  ].map((legendRow) => Object.freeze(legendRow)),
)

const WHOLE_YEAR_TITLE = 'Whole year'
const TERM_TITLES = Object.freeze({ 1: '1st Semester', 2: '2nd Semester' })

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

function listRows(rowList) {
  return Array.isArray(rowList) ? rowList.filter(isRecordObject) : []
}

function pickText(textValue) {
  if (textValue === null || textValue === undefined || textValue === '') return NO_VALUE_LABEL
  return String(textValue)
}

function buildHeaderItems(reportCard) {
  const sourceCard = isRecordObject(reportCard) ? reportCard : {}
  return [
    {
      key: 'name',
      label: 'Student',
      text: isRecordObject(sourceCard.student) ? formatEnrollmentStudentName(sourceCard.student) : NO_VALUE_LABEL,
    },
    { key: 'lrn', label: 'LRN', text: pickText(sourceCard.student?.lrn) },
    { key: 'school_year', label: 'School year', text: pickText(sourceCard.school_year?.name) },
    { key: 'grade_level', label: 'Grade level', text: pickText(sourceCard.grade_level?.name) },
    { key: 'section', label: 'Section', text: pickText(sourceCard.section?.name) },
    { key: 'adviser', label: 'Adviser', text: pickText(sourceCard.adviser?.name) },
  ]
}

function buildBlockTitle(termNumber) {
  if (termNumber === null || termNumber === undefined) return WHOLE_YEAR_TITLE
  return TERM_TITLES[termNumber] ?? pickText(termNumber)
}

function buildSubjectRow(subjectRow) {
  return {
    key: subjectRow.curriculum_entry_id,
    subjectText: pickText(buildSubjectText(subjectRow.subject)),
    quarterTexts: listRows(subjectRow.quarters).map((quarterEntry) => pickText(quarterEntry.grade)),
    finalText: pickText(subjectRow.final_grade),
    remarksText: pickText(subjectRow.remarks),
  }
}

function findAverage(reportCard, termNumber) {
  return listRows(reportCard.general_averages).find((averageEntry) => (averageEntry.term_number ?? null) === termNumber)
}

function buildBlock(reportCard, termNumber) {
  const blockSubjects = listRows(reportCard.subjects).filter((subjectRow) => (subjectRow.term_number ?? null) === termNumber)
  const averageEntry = findAverage(reportCard, termNumber)
  return {
    title: buildBlockTitle(termNumber),
    quarterNumbers: listRows(blockSubjects[0]?.quarters).map((quarterEntry) => quarterEntry.quarter),
    rows: blockSubjects.map(buildSubjectRow),
    averageText: pickText(averageEntry?.average),
    descriptorText: pickText(averageEntry?.descriptor),
  }
}

function listTermNumbers(reportCard) {
  const termNumbers = listRows(reportCard.subjects).map((subjectRow) => subjectRow.term_number ?? null)
  return [...new Set(termNumbers)]
}

export function buildReportCard(reportCard) {
  if (!isRecordObject(reportCard)) return { key: '', headerItems: buildHeaderItems(null), blocks: [] }
  return {
    key: reportCard.student?.id ?? '',
    headerItems: buildHeaderItems(reportCard),
    blocks: listTermNumbers(reportCard).map((termNumber) => buildBlock(reportCard, termNumber)),
  }
}

export function buildSectionReportCards(response) {
  if (!Array.isArray(response?.report_cards)) return []
  return response.report_cards.map(buildReportCard)
}
