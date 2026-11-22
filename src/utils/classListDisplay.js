import { WHOLE_YEAR_LABEL } from '@/utils/enrollmentDisplay.js'
import { buildRosterGroups } from '@/utils/rosterDisplay.js'
import {
  NOT_SCHEDULED_LABEL,
  buildMeetingSummary,
  buildSectionOptionLabel,
  buildSectionTimetableEntries,
  buildTeacherTimetableEntries,
  listScheduleRows,
} from '@/utils/scheduleDisplay.js'
import { SCHOOL_DAYS } from '@/utils/scheduleForm.js'
import { NO_VALUE_LABEL, buildRoomLabel, formatSectionAdviser } from '@/utils/sectionDisplay.js'
import { buildTermLabel } from '@/utils/termDisplay.js'

export const MY_CLASS_COLUMNS = Object.freeze(
  [
    { key: 'section', label: 'Section' },
    { key: 'subject', label: 'Subject' },
    { key: 'schedule', label: 'Schedule' },
    { key: 'students', label: 'Students' },
  ].map((column) => Object.freeze(column)),
)

const CLASS_LINK_SEPARATOR = ' · '

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

function pickText(textValue) {
  return typeof textValue === 'string' && textValue.trim() !== '' ? textValue : NO_VALUE_LABEL
}

function findDayOrder(meeting) {
  return SCHOOL_DAYS.findIndex((schoolDay) => String(schoolDay) === String(meeting?.day))
}

function compareMeetings(firstMeeting, secondMeeting) {
  const dayDifference = findDayOrder(firstMeeting) - findDayOrder(secondMeeting)
  if (dayDifference !== 0) return dayDifference
  return String(firstMeeting?.start_time ?? '').localeCompare(String(secondMeeting?.start_time ?? ''))
}

export function buildScheduleSummaryLines(meetings) {
  if (!Array.isArray(meetings) || meetings.length === 0) return [NOT_SCHEDULED_LABEL]
  return [...meetings].sort(compareMeetings).map(buildMeetingSummary)
}

export function buildSubjectText(subject) {
  return `${subject?.code ?? ''} ${subject?.name ?? ''}`.trim()
}

function buildMyClassRow(classRecord) {
  return {
    id: classRecord.id,
    section: buildSectionOptionLabel({ name: classRecord.section?.name, grade_level: classRecord.grade_level }),
    subject: buildSubjectText(classRecord.subject),
    scheduleLines: buildScheduleSummaryLines(classRecord.meetings),
    students: String(classRecord.student_count ?? 0),
  }
}

export function listMyClassRows(classes) {
  if (!Array.isArray(classes)) return []
  return classes.filter(isRecordObject).map(buildMyClassRow)
}

function attachClassToMeetings(classRecord) {
  const meetings = Array.isArray(classRecord.meetings) ? classRecord.meetings : []
  return meetings.map((meeting) => ({ ...meeting, class: classRecord }))
}

export function buildMyTimetableEntries(classes) {
  if (!Array.isArray(classes)) return []
  const classMeetings = classes.filter(isRecordObject).flatMap(attachClassToMeetings)
  return buildTeacherTimetableEntries(classMeetings)
}

export function formatClassTerm(termNumber, termType) {
  if (termNumber === null || termNumber === undefined) return WHOLE_YEAR_LABEL
  return buildTermLabel(termType, termNumber) || NO_VALUE_LABEL
}

export function buildClassHeaderItems(classHeader) {
  const headerRecord = isRecordObject(classHeader) ? classHeader : {}
  return [
    { key: 'school_year', label: 'School year', text: pickText(headerRecord.school_year?.name) },
    {
      key: 'term',
      label: 'Term',
      text: formatClassTerm(headerRecord.term_number, headerRecord.school_year?.term_type),
    },
    { key: 'section', label: 'Section', text: pickText(headerRecord.section?.name) },
    { key: 'grade_level', label: 'Grade level', text: pickText(headerRecord.grade_level?.name) },
    { key: 'subject', label: 'Subject', text: pickText(buildSubjectText(headerRecord.subject)) },
    { key: 'teacher', label: 'Teacher', text: pickText(headerRecord.teacher?.name) },
  ]
}

function buildClassLink(scheduleRow) {
  const teacherName = scheduleRow.class.teacher?.name ?? NO_VALUE_LABEL
  return {
    classId: scheduleRow.class.id,
    label: `${scheduleRow.subject?.code ?? ''}${CLASS_LINK_SEPARATOR}${teacherName}`,
  }
}

export function buildAdvisoryBlock(advisoryResponse) {
  const advisorySection = advisoryResponse?.advisory_section
  if (!isRecordObject(advisorySection) || !isRecordObject(advisorySection.section)) return null
  const section = advisorySection.section
  const scheduleRows = listScheduleRows({ subjects: advisorySection.timetable })
  return {
    sectionId: section.id,
    sectionText: buildSectionOptionLabel(section),
    adviserText: formatSectionAdviser(section),
    roomText: buildRoomLabel(section.room) || NO_VALUE_LABEL,
    enrolledText: String(section.enrolled_count ?? 0),
    termNumber: advisorySection.term_number ?? null,
    scheduleRows,
    entries: buildSectionTimetableEntries(scheduleRows),
    classLinks: scheduleRows.filter((scheduleRow) => isRecordObject(scheduleRow.class)).map(buildClassLink),
    rosterGroups: buildRosterGroups(advisorySection),
  }
}
