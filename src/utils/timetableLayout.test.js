import { describe, it, expect } from 'vitest'
import { buildTimeAxisLabels, buildTimetableColumns } from '@/utils/timetableLayout.js'

function buildEntry(entryChanges) {
  return { key: 'entry', day: 1, start_time: '08:00', end_time: '09:00', title: 'T', subtitle: 'S', ...entryChanges }
}

function getMondayBlocks(entries) {
  return buildTimetableColumns(entries)[0].blocks
}

describe('buildTimeAxisLabels', () => {
  it('(1) lists 24 half-hour labels from 06:00 to 17:30', () => {
    const axisLabels = buildTimeAxisLabels()
    expect(axisLabels).toHaveLength(24)
    expect(axisLabels[0]).toBe('06:00')
    expect(axisLabels[1]).toBe('06:30')
    expect(axisLabels[23]).toBe('17:30')
  })
})

describe('buildTimetableColumns', () => {
  it('(2) returns six day columns without blocks for no entries', () => {
    const columns = buildTimetableColumns([])
    expect(columns.map((column) => column.day)).toEqual([1, 2, 3, 4, 5, 6])
    expect(columns[0].label).toBe('Monday')
    expect(columns[5].label).toBe('Saturday')
    expect(columns.every((column) => column.blocks.length === 0)).toBe(true)
  })

  it('(3) places a block by its start and length', () => {
    const [block] = getMondayBlocks([buildEntry({ start_time: '07:00', end_time: '08:00' })])
    expect(block.topPercent).toBeCloseTo(8.333, 2)
    expect(block.heightPercent).toBeCloseTo(8.333, 2)
    expect(block.leftPercent).toBe(0)
    expect(block.widthPercent).toBe(100)
  })

  it('(4) fills the column for a 06:00 to 18:00 meeting', () => {
    const [block] = getMondayBlocks([buildEntry({ start_time: '06:00', end_time: '18:00' })])
    expect(block.topPercent).toBe(0)
    expect(block.heightPercent).toBe(100)
  })

  it('(5) keeps touching meetings edge to edge in lane 0', () => {
    const blocks = getMondayBlocks([
      buildEntry({ key: 'a', start_time: '08:00', end_time: '09:00' }),
      buildEntry({ key: 'b', start_time: '09:00', end_time: '10:00' }),
    ])
    expect(blocks.map((block) => block.lane)).toEqual([0, 0])
    expect(blocks.map((block) => block.widthPercent)).toEqual([100, 100])
  })

  it('(6) splits overlapping meetings and reuses a freed lane', () => {
    const overlappingBlocks = getMondayBlocks([
      buildEntry({ key: 'a', start_time: '08:00', end_time: '10:00' }),
      buildEntry({ key: 'b', start_time: '09:00', end_time: '11:00' }),
    ])
    expect(overlappingBlocks.map((block) => block.widthPercent)).toEqual([50, 50])
    expect(overlappingBlocks.map((block) => block.leftPercent)).toEqual([0, 50])
    const chainedBlocks = getMondayBlocks([
      buildEntry({ key: 'a', start_time: '08:00', end_time: '10:00' }),
      buildEntry({ key: 'b', start_time: '09:00', end_time: '11:00' }),
      buildEntry({ key: 'c', start_time: '10:00', end_time: '11:00' }),
    ])
    expect(chainedBlocks.map((block) => block.lane)).toEqual([0, 1, 0])
    expect(chainedBlocks.every((block) => block.widthPercent === 50)).toBe(true)
  })

  it('(7) sorts by start and drops unplaceable entries', () => {
    const blocks = getMondayBlocks([
      buildEntry({ key: 'late', start_time: '10:00', end_time: '11:00' }),
      buildEntry({ key: 'early', start_time: '08:00', end_time: '09:00' }),
      buildEntry({ key: 'bad-day', day: 7 }),
      buildEntry({ key: 'bad-time', start_time: '8:00' }),
      buildEntry({ key: 'flat', start_time: '09:00', end_time: '09:00' }),
    ])
    expect(blocks.map((block) => block.key)).toEqual(['early', 'late'])
    expect(buildTimetableColumns(null).every((column) => column.blocks.length === 0)).toBe(true)
  })

  it('(8) clamps a meeting that starts before the school day', () => {
    const [block] = getMondayBlocks([buildEntry({ start_time: '05:00', end_time: '07:00' })])
    expect(block.topPercent).toBe(0)
    expect(block.heightPercent).toBeCloseTo(8.333, 2)
  })
})
