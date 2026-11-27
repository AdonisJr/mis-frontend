import { describe, it, expect, vi, beforeEach } from 'vitest'
import http from '@/services/http.js'
import {
  createStudentMobileAccount,
  deactivateStudentMobileAccount,
  fetchStudentMobileAccount,
  generateSectionMobileAccounts,
  reactivateStudentMobileAccount,
  resetStudentMobilePassword,
} from '@/services/mobileAccountService.js'

vi.mock('@/services/http.js', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

const STUDENT_ID_MESSAGE = 'A valid student id is required.'
const SECTION_ID_MESSAGE = 'A valid section id is required.'
const ACCOUNT = { status: 'must_change_password', must_change_password: true, is_active: true }
const STUDENT_FUNCTIONS = [
  fetchStudentMobileAccount,
  createStudentMobileAccount,
  resetStudentMobilePassword,
  deactivateStudentMobileAccount,
  reactivateStudentMobileAccount,
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchStudentMobileAccount', () => {
  it('gets the account and returns the response data', async () => {
    http.get.mockResolvedValue({ data: { account: ACCOUNT } })
    await expect(fetchStudentMobileAccount(7)).resolves.toEqual({ account: ACCOUNT })
    expect(http.get).toHaveBeenCalledWith('/students/7/mobile-account')
  })
})

describe('createStudentMobileAccount', () => {
  it('posts with no body and returns the account and temporary password', async () => {
    const createResponse = { account: ACCOUNT, temporary_password: 'Kx7mQ4pa' }
    http.post.mockResolvedValue({ data: createResponse })
    await expect(createStudentMobileAccount(7)).resolves.toEqual(createResponse)
    expect(http.post).toHaveBeenCalledWith('/students/7/mobile-account')
  })
})

describe('resetStudentMobilePassword', () => {
  it('puts the password path with no body', async () => {
    http.put.mockResolvedValue({ data: { account: ACCOUNT, temporary_password: 'Rt9wHb3e' } })
    await expect(resetStudentMobilePassword(7)).resolves.toEqual({ account: ACCOUNT, temporary_password: 'Rt9wHb3e' })
    expect(http.put).toHaveBeenCalledWith('/students/7/mobile-account/password')
  })
})

describe('deactivate and reactivate', () => {
  it('put their own paths with no body', async () => {
    http.put.mockResolvedValue({ data: { account: ACCOUNT } })
    await deactivateStudentMobileAccount(7)
    await reactivateStudentMobileAccount(7)
    expect(http.put).toHaveBeenNthCalledWith(1, '/students/7/mobile-account/deactivate')
    expect(http.put).toHaveBeenNthCalledWith(2, '/students/7/mobile-account/reactivate')
  })
})

describe('generateSectionMobileAccounts', () => {
  it('posts the section path with no body and returns the generated accounts', async () => {
    const generateResponse = { accounts: [], created_count: 0, skipped_count: 0 }
    http.post.mockResolvedValue({ data: generateResponse })
    await expect(generateSectionMobileAccounts(12)).resolves.toEqual(generateResponse)
    expect(http.post).toHaveBeenCalledWith('/sections/12/mobile-accounts')
  })
})

describe('id guards', () => {
  it('reject an invalid student id before any request', async () => {
    for (const studentFunction of STUDENT_FUNCTIONS) {
      await expect(studentFunction(0)).rejects.toThrow(STUDENT_ID_MESSAGE)
      await expect(studentFunction('7')).rejects.toThrow(STUDENT_ID_MESSAGE)
      await expect(studentFunction(null)).rejects.toThrow(STUDENT_ID_MESSAGE)
    }
    expect(http.get).not.toHaveBeenCalled()
    expect(http.post).not.toHaveBeenCalled()
    expect(http.put).not.toHaveBeenCalled()
  })

  it('reject an invalid section id before any request', async () => {
    await expect(generateSectionMobileAccounts('12')).rejects.toThrow(SECTION_ID_MESSAGE)
    await expect(generateSectionMobileAccounts(-1)).rejects.toThrow(SECTION_ID_MESSAGE)
    expect(http.post).not.toHaveBeenCalled()
  })
})

describe('request failures', () => {
  it('reject with the same error object', async () => {
    const requestError = new Error('Network Error')
    http.post.mockRejectedValue(requestError)
    await expect(createStudentMobileAccount(7)).rejects.toBe(requestError)
  })
})
