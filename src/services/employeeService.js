import http from '@/services/http.js'

const EMPLOYEES_PATH = '/employees'
const PASSWORD_SEGMENT = '/password'
const DEACTIVATE_SEGMENT = '/deactivate'
const REACTIVATE_SEGMENT = '/reactivate'
const INVALID_EMPLOYEE_ID_MESSAGE = 'A valid employee id is required.'

function assertEmployeeId(employeeId) {
  if (Number.isInteger(employeeId) && employeeId > 0) return
  throw new Error(INVALID_EMPLOYEE_ID_MESSAGE)
}

function buildEmployeePath(employeeId) {
  assertEmployeeId(employeeId)
  return `${EMPLOYEES_PATH}/${employeeId}`
}

export async function fetchEmployees(employeeListParams) {
  const response = await http.get(EMPLOYEES_PATH, { params: employeeListParams })
  return response.data
}

export async function createEmployee(employeePayload) {
  const response = await http.post(EMPLOYEES_PATH, employeePayload)
  return response.data
}

export async function updateEmployee(employeeId, employeePayload) {
  const response = await http.put(buildEmployeePath(employeeId), employeePayload)
  return response.data
}

export async function setEmployeePassword(employeeId, passwordPayload) {
  const response = await http.put(buildEmployeePath(employeeId) + PASSWORD_SEGMENT, passwordPayload)
  return response.data
}

export async function deactivateEmployee(employeeId) {
  const response = await http.put(buildEmployeePath(employeeId) + DEACTIVATE_SEGMENT)
  return response.data
}

export async function reactivateEmployee(employeeId) {
  const response = await http.put(buildEmployeePath(employeeId) + REACTIVATE_SEGMENT)
  return response.data
}
