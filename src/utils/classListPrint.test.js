import { describe, it, expect } from 'vitest'
import {
  ADVISORY_SUBJECT_TEXT,
  PRINT_ROW_CLASS,
  buildAdvisoryPrintHeaderItems,
  buildClassPrintHeaderItems,
} from '@/utils/classListPrint.js'

const ADVISORY_BLOCK = { sectionText: 'Grade 7 · Rizal', adviserText: 'Ana Cruz', termNumber: null }

describe('buildClassPrintHeaderItems', () => {
  it('(1) keeps exactly the five print keys in order', () => {
    const printItems = buildClassPrintHeaderItems({
      school_year: { name: '2026-2027', term_type: 'semester' },
      term_number: 1,
      section: { name: 'Rizal' },
      grade_level: { name: 'Grade 7' },
      subject: { code: 'MATH7', name: 'Mathematics 7' },
      teacher: { name: 'Ana Cruz' },
    })
    expect(printItems.map((printItem) => printItem.key)).toEqual(['school_year', 'term', 'section', 'subject', 'teacher'])
  })
})

describe('buildAdvisoryPrintHeaderItems', () => {
  it('(2) uses the advisory subject, the adviser and the right term text', () => {
    const jhsItems = buildAdvisoryPrintHeaderItems(ADVISORY_BLOCK, { name: '2026-2027', term_type: 'semester' })
    expect(jhsItems.find((printItem) => printItem.key === 'subject').text).toBe(ADVISORY_SUBJECT_TEXT)
    expect(jhsItems.find((printItem) => printItem.key === 'teacher').text).toBe('Ana Cruz')
    expect(jhsItems.find((printItem) => printItem.key === 'term').text).toBe('Whole year')
    const shsItems = buildAdvisoryPrintHeaderItems({ ...ADVISORY_BLOCK, termNumber: 2 }, { name: '2026-2027', term_type: 'semester' })
    expect(shsItems.find((printItem) => printItem.key === 'term').text).toBe('2nd Semester')
  })
})

describe('PRINT_ROW_CLASS', () => {
  it('(3) is the Tailwind break-inside utility', () => {
    expect(PRINT_ROW_CLASS).toBe('break-inside-avoid')
  })
})

describe('print header with bad input', () => {
  it('(4) falls back to five placeholder items', () => {
    const classItems = buildClassPrintHeaderItems(null)
    expect(classItems).toHaveLength(5)
    expect(classItems.every((printItem) => printItem.text === '—' || printItem.key === 'term')).toBe(true)
    const advisoryItems = buildAdvisoryPrintHeaderItems(null, null)
    expect(advisoryItems).toHaveLength(5)
    expect(advisoryItems.find((printItem) => printItem.key === 'section').text).toBe('—')
  })
})
