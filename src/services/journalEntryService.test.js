import { describe, it, expect, vi, beforeEach } from 'vitest'
import http from '@/services/http.js'
import {
  createJournalEntry,
  deleteJournalEntry,
  fetchJournalEntries,
  fetchJournalEntry,
  postJournalEntry,
  reverseJournalEntry,
  updateJournalEntry,
} from '@/services/journalEntryService.js'

vi.mock('@/services/http.js', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const JOURNAL_PAYLOAD = {
  entry_date: '2026-11-20',
  description: 'Tuition collected',
  reference: null,
  lines: [
    { account_id: 1, debit: '100.00', credit: '0.00', memo: null },
    { account_id: 2, debit: '0.00', credit: '100.00', memo: null },
  ],
}
const ID_MESSAGE = 'A valid journal entry id is required.'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('journalEntryService', () => {
  it('lists /journal-entries with the params and returns the response data', async () => {
    http.get.mockResolvedValue({ data: { journal_entries: [], meta: {} } })
    await expect(fetchJournalEntries({ status: 'draft', page: 2 })).resolves.toEqual({ journal_entries: [], meta: {} })
    expect(http.get).toHaveBeenCalledWith('/journal-entries', { params: { status: 'draft', page: 2 } })
  })

  it('gets /journal-entries/7', async () => {
    http.get.mockResolvedValue({ data: { journal_entry: { id: 7 } } })
    await expect(fetchJournalEntry(7)).resolves.toEqual({ journal_entry: { id: 7 } })
    expect(http.get).toHaveBeenCalledWith('/journal-entries/7')
  })

  it('posts the create body to /journal-entries', async () => {
    http.post.mockResolvedValue({ data: { journal_entry: { id: 9 } } })
    await expect(createJournalEntry(JOURNAL_PAYLOAD)).resolves.toEqual({ journal_entry: { id: 9 } })
    expect(http.post).toHaveBeenCalledWith('/journal-entries', JOURNAL_PAYLOAD)
  })

  it('puts the update body to /journal-entries/7', async () => {
    http.put.mockResolvedValue({ data: { journal_entry: { id: 7 } } })
    await expect(updateJournalEntry(7, JOURNAL_PAYLOAD)).resolves.toEqual({ journal_entry: { id: 7 } })
    expect(http.put).toHaveBeenCalledWith('/journal-entries/7', JOURNAL_PAYLOAD)
  })

  it('deletes /journal-entries/7', async () => {
    http.delete.mockResolvedValue({ data: '' })
    await deleteJournalEntry(7)
    expect(http.delete).toHaveBeenCalledWith('/journal-entries/7')
  })

  it('posts a draft through /journal-entries/7/post with no body', async () => {
    http.post.mockResolvedValue({ data: { journal_entry: { id: 7, status: 'posted' } } })
    await expect(postJournalEntry(7)).resolves.toEqual({ journal_entry: { id: 7, status: 'posted' } })
    expect(http.post).toHaveBeenCalledWith('/journal-entries/7/post')
  })

  it('reverses through /journal-entries/7/reverse with the reason and date', async () => {
    http.post.mockResolvedValue({ data: { journal_entry: { id: 8 } } })
    await reverseJournalEntry(7, { reason: 'Wrong account', date: '2026-11-20' })
    expect(http.post).toHaveBeenCalledWith('/journal-entries/7/reverse', { reason: 'Wrong account', date: '2026-11-20' })
  })

  it('rejects an invalid id without calling http', async () => {
    await expect(fetchJournalEntry('7')).rejects.toThrow(ID_MESSAGE)
    await expect(deleteJournalEntry(0)).rejects.toThrow(ID_MESSAGE)
    await expect(postJournalEntry(null)).rejects.toThrow(ID_MESSAGE)
    expect(http.get).not.toHaveBeenCalled()
    expect(http.delete).not.toHaveBeenCalled()
    expect(http.post).not.toHaveBeenCalled()
  })

  it('lets a rejected 422 error pass through unchanged', async () => {
    const validationError = { response: { status: 422, data: { message: 'x', errors: { entry: ['y'] } } } }
    http.post.mockRejectedValue(validationError)
    await expect(postJournalEntry(7)).rejects.toBe(validationError)
  })
})
