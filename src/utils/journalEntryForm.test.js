import { describe, it, expect } from 'vitest'
import {
  buildFormFromJournalEntry,
  buildJournalEntryPayload,
  createEmptyJournalEntryForm,
  findJournalEntryFormErrors,
} from '@/utils/journalEntryForm.js'

const TODAY = '2026-11-26'

function buildValidForm() {
  return {
    entry_date: TODAY,
    description: 'Tuition collected',
    reference: '',
    lines: [
      { account_id: '1', debit: '100.00', credit: '', memo: '' },
      { account_id: '2', debit: '', credit: '100.00', memo: '' },
    ],
  }
}

describe('createEmptyJournalEntryForm', () => {
  it('starts today with two empty rows', () => {
    const emptyForm = createEmptyJournalEntryForm(TODAY)
    expect(emptyForm).toMatchObject({ entry_date: TODAY, description: '', reference: '' })
    expect(emptyForm.lines).toHaveLength(2)
  })
})

describe('buildFormFromJournalEntry', () => {
  it('uses strings, blanks a 0.00 side, keeps ids as strings and pads to two rows', () => {
    const journalEntry = {
      entry_date: '2026-11-20',
      description: 'Adj',
      reference: null,
      created_by: { id: 1, name: 'A' },
      lines: [{ id: 1, account: { id: 5, code: '1010', name: 'Cash' }, debit: '10.50', credit: '0.00', memo: null }],
    }
    const formValues = buildFormFromJournalEntry(journalEntry)
    expect(formValues.reference).toBe('')
    expect(formValues.lines).toEqual([
      { account_id: '5', debit: '10.50', credit: '', memo: '' },
      { account_id: '', debit: '', credit: '', memo: '' },
    ])
  })
})

describe('findJournalEntryFormErrors', () => {
  it('accepts a valid form', () => {
    expect(findJournalEntryFormErrors(buildValidForm(), TODAY)).toEqual({})
  })

  it('requires a valid date', () => {
    expect(findJournalEntryFormErrors({ ...buildValidForm(), entry_date: '' }, TODAY).entry_date).toEqual(['Enter a valid date.'])
    expect(findJournalEntryFormErrors({ ...buildValidForm(), entry_date: '2026-02-31' }, TODAY).entry_date).toEqual([
      'Enter a valid date.',
    ])
  })

  it('refuses a future date but allows today', () => {
    expect(findJournalEntryFormErrors({ ...buildValidForm(), entry_date: '2026-11-27' }, TODAY).entry_date).toEqual([
      'The date cannot be in the future.',
    ])
    expect(findJournalEntryFormErrors({ ...buildValidForm(), entry_date: TODAY }, TODAY).entry_date).toBeUndefined()
  })

  it('requires the description and caps it at 500', () => {
    expect(findJournalEntryFormErrors({ ...buildValidForm(), description: '  ' }, TODAY).description).toEqual([
      'Description is required.',
    ])
    expect(findJournalEntryFormErrors({ ...buildValidForm(), description: 'x'.repeat(500) }, TODAY).description).toBeUndefined()
    expect(findJournalEntryFormErrors({ ...buildValidForm(), description: 'x'.repeat(501) }, TODAY).description).toEqual([
      'The description must be at most 500 characters.',
    ])
  })

  it('caps the reference at 100', () => {
    expect(findJournalEntryFormErrors({ ...buildValidForm(), reference: 'x'.repeat(101) }, TODAY).reference).toEqual([
      'The reference must be at most 100 characters.',
    ])
  })

  it('merges the line errors under lines.N.*', () => {
    const formValues = buildValidForm()
    formValues.lines[1].account_id = ''
    expect(findJournalEntryFormErrors(formValues, TODAY)).toEqual({ 'lines.1.account_id': ['Choose an account.'] })
  })
})

describe('buildJournalEntryPayload', () => {
  it('trims, sends 0.00 for the empty side, nulls blanks and keeps every row in order', () => {
    const formValues = buildValidForm()
    formValues.description = '  Tuition collected '
    formValues.lines = [...formValues.lines, { account_id: '', debit: '', credit: '', memo: '  note ' }]
    expect(buildJournalEntryPayload(formValues)).toEqual({
      entry_date: TODAY,
      description: 'Tuition collected',
      reference: null,
      lines: [
        { account_id: 1, debit: '100.00', credit: '0.00', memo: null },
        { account_id: 2, debit: '0.00', credit: '100.00', memo: null },
        { account_id: null, debit: '0.00', credit: '0.00', memo: 'note' },
      ],
    })
  })
})
