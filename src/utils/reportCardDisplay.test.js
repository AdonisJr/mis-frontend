import { describe, it, expect } from 'vitest'
import { DESCRIPTOR_LEGEND, buildReportCard, buildSectionReportCards } from '@/utils/reportCardDisplay.js'

function buildQuarters(quarterNumbers, grade) {
  return quarterNumbers.map((quarterNumber) => ({ quarter: quarterNumber, grade }))
}

function buildSubject(entryId, termNumber, quarterNumbers, overrides = {}) {
  return {
    curriculum_entry_id: entryId,
    term_number: termNumber,
    subject: { id: entryId, code: `S${entryId}`, name: `Subject ${entryId}` },
    quarters: buildQuarters(quarterNumbers, 88),
    final_grade: 88,
    remarks: 'Passed',
    ...overrides,
  }
}

function buildCard(subjects, generalAverages) {
  return {
    student: { id: 7, lrn: '123456789012', first_name: 'Ana', middle_name: 'Bautista', last_name: 'Cruz' },
    school_year: { id: 9, name: '2026-2027', term_type: 'semester' },
    grade_level: { id: 1, name: 'Grade 7', stage: 'jhs' },
    program: null,
    section: { id: 3, name: 'Rizal' },
    adviser: { id: 5, name: 'Ben Reyes' },
    subjects,
    general_averages: generalAverages,
  }
}

describe('buildReportCard header', () => {
  it('(1) builds the header items and shows dashes for gaps', () => {
    const reportCard = buildReportCard(buildCard([], []))
    expect(reportCard.key).toBe(7)
    expect(reportCard.headerItems.map((item) => item.text)).toEqual([
      'Cruz, Ana B.',
      '123456789012',
      '2026-2027',
      'Grade 7',
      'Rizal',
      'Ben Reyes',
    ])
    const gapCard = buildReportCard({ ...buildCard([], []), adviser: null, student: { id: 7, first_name: 'A', last_name: 'B' } })
    expect(gapCard.headerItems.find((item) => item.key === 'adviser').text).toBe('—')
    expect(gapCard.headerItems.find((item) => item.key === 'lrn').text).toBe('—')
  })
})

describe('buildReportCard blocks', () => {
  it('(2) builds one JHS whole-year block with Q1 to Q4 and dashes for nulls', () => {
    const subjects = [
      buildSubject(1, null, [1, 2, 3, 4]),
      buildSubject(2, null, [1, 2, 3, 4], { quarters: buildQuarters([1, 2, 3, 4], null), final_grade: null, remarks: null }),
    ]
    const { blocks } = buildReportCard(buildCard(subjects, [{ term_number: null, average: '88.00', descriptor: 'Very Satisfactory' }]))
    expect(blocks).toHaveLength(1)
    expect(blocks[0].title).toBe('Whole year')
    expect(blocks[0].quarterNumbers).toEqual([1, 2, 3, 4])
    expect(blocks[0].rows[0]).toMatchObject({ subjectText: 'S1 Subject 1', finalText: '88', remarksText: 'Passed' })
    expect(blocks[0].rows[1]).toMatchObject({
      quarterTexts: ['—', '—', '—', '—'],
      finalText: '—',
      remarksText: '—',
    })
  })

  it('(3) takes the quarter columns from the returned quarters and never hard-codes them', () => {
    const subjects = [buildSubject(1, 1, [1, 2]), buildSubject(2, 2, [3, 4])]
    const averages = [
      { term_number: 1, average: '88.25', descriptor: 'Very Satisfactory' },
      { term_number: 2, average: '90.00', descriptor: 'Outstanding' },
    ]
    const { blocks } = buildReportCard(buildCard(subjects, averages))
    expect(blocks.map((block) => block.title)).toEqual(['1st Semester', '2nd Semester'])
    expect(blocks.map((block) => block.quarterNumbers)).toEqual([[1, 2], [3, 4]])
    expect(blocks.map((block) => block.averageText)).toEqual(['88.25', '90.00'])
    const threeQuarterBlock = buildReportCard(buildCard([buildSubject(1, null, [1, 2, 3])], [])).blocks[0]
    expect(threeQuarterBlock.quarterNumbers).toEqual([1, 2, 3])
    expect(threeQuarterBlock.rows[0].quarterTexts).toHaveLength(3)
  })

  it('(4) shows the average and descriptor, or dashes when missing', () => {
    const subjects = [buildSubject(1, 1, [1, 2])]
    const withAverage = buildReportCard(buildCard(subjects, [{ term_number: 1, average: '88.25', descriptor: 'Very Satisfactory' }]))
    expect(withAverage.blocks[0]).toMatchObject({ averageText: '88.25', descriptorText: 'Very Satisfactory' })
    const withoutAverage = buildReportCard(buildCard(subjects, [{ term_number: 1, average: null, descriptor: null }]))
    expect(withoutAverage.blocks[0]).toMatchObject({ averageText: '—', descriptorText: '—' })
  })
})

describe('legend and section cards', () => {
  it('(5) lists the five descriptors exactly', () => {
    expect(DESCRIPTOR_LEGEND.map((legendRow) => legendRow.descriptor)).toEqual([
      'Outstanding',
      'Very Satisfactory',
      'Satisfactory',
      'Fairly Satisfactory',
      'Did Not Meet Expectations',
    ])
    expect(DESCRIPTOR_LEGEND[0].range).toBe('90-100')
    expect(DESCRIPTOR_LEGEND[4].range).toBe('Below 75')
  })

  it('(6) returns a card without blocks for a non-object', () => {
    expect(buildReportCard(null).blocks).toEqual([])
    expect(buildReportCard('x').blocks).toEqual([])
  })

  it('(7) maps the section report cards and returns an empty list for a bad response', () => {
    const response = { report_cards: [buildCard([], []), buildCard([buildSubject(1, null, [1])], [])] }
    expect(buildSectionReportCards(response)).toHaveLength(2)
    expect(buildSectionReportCards({ report_cards: 'x' })).toEqual([])
    expect(buildSectionReportCards(null)).toEqual([])
  })
})
