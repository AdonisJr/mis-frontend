import http from '@/services/http.js'

const JOURNAL_ENTRIES_PATH = '/journal-entries'
const POST_SEGMENT = '/post'
const REVERSE_SEGMENT = '/reverse'
const INVALID_JOURNAL_ENTRY_ID_MESSAGE = 'A valid journal entry id is required.'

function assertJournalEntryId(entryId) {
  if (Number.isInteger(entryId) && entryId > 0) return
  throw new Error(INVALID_JOURNAL_ENTRY_ID_MESSAGE)
}

function buildJournalEntryPath(entryId) {
  assertJournalEntryId(entryId)
  return `${JOURNAL_ENTRIES_PATH}/${entryId}`
}

export async function fetchJournalEntries(journalListParams) {
  const response = await http.get(JOURNAL_ENTRIES_PATH, { params: journalListParams })
  return response.data
}

export async function fetchJournalEntry(entryId) {
  const response = await http.get(buildJournalEntryPath(entryId))
  return response.data
}

export async function createJournalEntry(journalPayload) {
  const response = await http.post(JOURNAL_ENTRIES_PATH, journalPayload)
  return response.data
}

export async function updateJournalEntry(entryId, journalPayload) {
  const response = await http.put(buildJournalEntryPath(entryId), journalPayload)
  return response.data
}

export async function deleteJournalEntry(entryId) {
  const response = await http.delete(buildJournalEntryPath(entryId))
  return response.data
}

export async function postJournalEntry(entryId) {
  const response = await http.post(buildJournalEntryPath(entryId) + POST_SEGMENT)
  return response.data
}

export async function reverseJournalEntry(entryId, reversePayload) {
  const response = await http.post(buildJournalEntryPath(entryId) + REVERSE_SEGMENT, reversePayload)
  return response.data
}
