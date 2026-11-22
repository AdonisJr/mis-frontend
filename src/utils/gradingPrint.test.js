import { describe, it, expect } from 'vitest'
import {
  CLASS_RECORD_PRINT_PAGE_CLASS,
  REPORT_CARD_BREAK_CLASS,
  buildClassRecordPrintHeaderItems,
} from '@/utils/gradingPrint.js'

const CLASS_RECORD = {
  weights: { ww: 30, pt: 50, qa: 20 },
  class: {
    school_year: { id: 1, name: '2026-2027', term_type: 'semester' },
    term_number: 1,
    section: { id: 3, name: 'Rizal' },
    grade_level: { id: 1, name: 'Grade 7' },
    subject: { id: 2, code: 'MATH7', name: 'Mathematics 7' },
    teacher: { id: 5, name: 'Ana Cruz' },
  },
}

describe('buildClassRecordPrintHeaderItems', () => {
  it('(1) lists the print header keys in order', () => {
    expect(buildClassRecordPrintHeaderItems(CLASS_RECORD, 2).map((item) => item.key)).toEqual([
      'school_year',
      'quarter',
      'section',
      'subject',
      'teacher',
      'weights',
    ])
  })

  it('(2) fills the quarter and weights text and shows dashes for gaps', () => {
    const items = buildClassRecordPrintHeaderItems(CLASS_RECORD, 2)
    expect(items.find((item) => item.key === 'quarter').text).toBe('Quarter 2')
    expect(items.find((item) => item.key === 'weights').text).toBe('WW 30% · PT 50% · QA 20%')
    expect(items.find((item) => item.key === 'subject').text).toBe('MATH7 Mathematics 7')
    const gapItems = buildClassRecordPrintHeaderItems(null, '')
    expect(gapItems.map((item) => item.text)).toEqual(['—', '—', '—', '—', '—', '—'])
  })
})

describe('print classes', () => {
  it('(3) exposes both class constants', () => {
    expect(CLASS_RECORD_PRINT_PAGE_CLASS).toBe('print-page-class-record')
    expect(REPORT_CARD_BREAK_CLASS).toBe('break-after-page')
  })
})
