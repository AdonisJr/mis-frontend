import { getDayLabel } from '@/utils/scheduleDisplay.js'
import { SCHOOL_DAYS, SCHOOL_DAY_END, SCHOOL_DAY_START, toMinutesOfDay } from '@/utils/scheduleForm.js'

export const GRID_ROW_MINUTES = 30

const GRID_START_MINUTES = toMinutesOfDay(SCHOOL_DAY_START)
const GRID_END_MINUTES = toMinutesOfDay(SCHOOL_DAY_END)
const GRID_SPAN_MINUTES = GRID_END_MINUTES - GRID_START_MINUTES
const MINUTES_PER_HOUR = 60
const PERCENT = 100

function formatMinutesOfDay(minutesOfDay) {
  const hourText = String(Math.floor(minutesOfDay / MINUTES_PER_HOUR)).padStart(2, '0')
  const minuteText = String(minutesOfDay % MINUTES_PER_HOUR).padStart(2, '0')
  return `${hourText}:${minuteText}`
}

export function buildTimeAxisLabels() {
  const rowCount = GRID_SPAN_MINUTES / GRID_ROW_MINUTES
  return Array.from({ length: rowCount }, (_unused, rowIndex) =>
    formatMinutesOfDay(GRID_START_MINUTES + rowIndex * GRID_ROW_MINUTES),
  )
}

function toPlacedEntry(entry) {
  const day = Number(entry?.day)
  const startMinutes = toMinutesOfDay(entry?.start_time)
  const endMinutes = toMinutesOfDay(entry?.end_time)
  if (!SCHOOL_DAYS.includes(day) || startMinutes === null || endMinutes === null) return null
  const placedStart = Math.max(startMinutes, GRID_START_MINUTES)
  const placedEnd = Math.min(endMinutes, GRID_END_MINUTES)
  if (placedStart >= placedEnd) return null
  return { ...entry, day, startMinutes: placedStart, endMinutes: placedEnd }
}

function findFreeLane(laneEnds, startMinutes) {
  const freeLane = laneEnds.findIndex((laneEnd) => laneEnd <= startMinutes)
  return freeLane === -1 ? laneEnds.length : freeLane
}

function groupIntoClusters(sortedEntries) {
  const clusters = []
  let clusterEnd = -1
  for (const entry of sortedEntries) {
    if (entry.startMinutes >= clusterEnd) clusters.push([])
    clusters[clusters.length - 1].push(entry)
    clusterEnd = Math.max(clusterEnd, entry.endMinutes)
  }
  return clusters
}

function assignClusterLanes(cluster) {
  const laneEnds = []
  const laneAssignments = cluster.map((entry) => {
    const lane = findFreeLane(laneEnds, entry.startMinutes)
    laneEnds[lane] = entry.endMinutes
    return { ...entry, lane }
  })
  return laneAssignments.map((laneEntry) => ({ ...laneEntry, laneCount: laneEnds.length }))
}

function compareByStart(firstEntry, secondEntry) {
  return firstEntry.startMinutes - secondEntry.startMinutes || firstEntry.endMinutes - secondEntry.endMinutes
}

function assignLanes(dayEntries) {
  const sortedEntries = [...dayEntries].sort(compareByStart)
  return groupIntoClusters(sortedEntries).flatMap(assignClusterLanes)
}

function toGridBlock(laneEntry) {
  return {
    ...laneEntry,
    topPercent: ((laneEntry.startMinutes - GRID_START_MINUTES) / GRID_SPAN_MINUTES) * PERCENT,
    heightPercent: ((laneEntry.endMinutes - laneEntry.startMinutes) / GRID_SPAN_MINUTES) * PERCENT,
    leftPercent: (laneEntry.lane / laneEntry.laneCount) * PERCENT,
    widthPercent: PERCENT / laneEntry.laneCount,
  }
}

export function buildTimetableColumns(timetableEntries) {
  const placedEntries = (Array.isArray(timetableEntries) ? timetableEntries : []).map(toPlacedEntry).filter(Boolean)
  return SCHOOL_DAYS.map((day) => ({
    day,
    label: getDayLabel(day),
    blocks: assignLanes(placedEntries.filter((placedEntry) => placedEntry.day === day)).map(toGridBlock),
  }))
}
