import http from '@/services/http.js'

const FEE_SCHEDULES_PATH = '/fee-schedules'
const COPY_PATH = '/fee-schedules/copy'
const INVALID_FEE_SCHEDULE_ID_MESSAGE = 'A valid fee schedule id is required.'

function assertFeeScheduleId(feeScheduleId) {
  if (Number.isInteger(feeScheduleId) && feeScheduleId > 0) return
  throw new Error(INVALID_FEE_SCHEDULE_ID_MESSAGE)
}

function buildFeeSchedulePath(feeScheduleId) {
  assertFeeScheduleId(feeScheduleId)
  return `${FEE_SCHEDULES_PATH}/${feeScheduleId}`
}

export async function fetchFeeSchedules(feeScheduleListParams) {
  const response = await http.get(FEE_SCHEDULES_PATH, { params: feeScheduleListParams })
  return response.data
}

export async function fetchFeeSchedule(feeScheduleId) {
  const response = await http.get(buildFeeSchedulePath(feeScheduleId))
  return response.data
}

export async function createFeeSchedule(feeSchedulePayload) {
  const response = await http.post(FEE_SCHEDULES_PATH, feeSchedulePayload)
  return response.data
}

export async function updateFeeSchedule(feeScheduleId, feeSchedulePayload) {
  const response = await http.put(buildFeeSchedulePath(feeScheduleId), feeSchedulePayload)
  return response.data
}

export async function deleteFeeSchedule(feeScheduleId) {
  const response = await http.delete(buildFeeSchedulePath(feeScheduleId))
  return response.data
}

export async function copyFeeSchedules(copyPayload) {
  const response = await http.post(COPY_PATH, copyPayload)
  return response.data
}
