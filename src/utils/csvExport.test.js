import { describe, it, expect, vi, afterEach } from 'vitest'
import { buildCsvFileName, buildCsvText, downloadCsvFile, formatCsvAmount } from '@/utils/csvExport.js'

const COLUMNS = [
  { key: 'name', label: 'Account' },
  { key: 'amount', label: 'Amount' },
]

function buildBody(csvRows) {
  return buildCsvText(COLUMNS, csvRows).split('\r\n')[1]
}

describe('buildCsvText', () => {
  it('writes a header line and one line per row', () => {
    expect(buildCsvText(COLUMNS, [{ name: 'Cash', amount: '10.00' }])).toBe('Account,Amount\r\nCash,10.00')
  })

  it('quotes a cell holding a comma', () => {
    expect(buildBody([{ name: 'Cash, on hand', amount: '1.00' }])).toBe('"Cash, on hand",1.00')
  })

  it('doubles quotes inside a quoted cell', () => {
    expect(buildBody([{ name: 'The "main" cash', amount: '1.00' }])).toBe('"The ""main"" cash",1.00')
  })

  it('quotes a cell holding a line break', () => {
    expect(buildBody([{ name: 'Cash\nbox', amount: '1.00' }])).toBe('"Cash\nbox",1.00')
  })

  it('writes null and undefined cells as empty', () => {
    expect(buildBody([{ name: null }])).toBe(',')
  })

  it('guards a cell that starts with a formula character', () => {
    expect(buildBody([{ name: '=SUM(A1)', amount: '1.00' }])).toBe("'=SUM(A1),1.00")
  })

  it('does not guard a negative amount', () => {
    expect(buildBody([{ name: 'Cash', amount: '-1234.50' }])).toBe('Cash,-1234.50')
  })

  it('joins lines with CRLF', () => {
    const csvText = buildCsvText(COLUMNS, [{ name: 'A' }, { name: 'B' }])
    expect(csvText.split('\r\n')).toHaveLength(3)
  })
})

describe('formatCsvAmount', () => {
  it('normalises a valid amount to two decimals', () => {
    expect(formatCsvAmount('1234.5')).toBe('1234.50')
    expect(formatCsvAmount('1234.50')).toBe('1234.50')
  })

  it('keeps the minus sign of a negative amount', () => {
    expect(formatCsvAmount('-1234.50')).toBe('-1234.50')
  })

  it('returns an empty text for an invalid amount', () => {
    expect(formatCsvAmount('abc')).toBe('')
    expect(formatCsvAmount(null)).toBe('')
  })
})

describe('buildCsvFileName', () => {
  it('joins the slug and the date label', () => {
    expect(buildCsvFileName('trial-balance', '2026-11-26')).toBe('trial-balance-2026-11-26.csv')
  })
})

describe('downloadCsvFile', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function stubBrowser() {
    const downloadLink = { click: vi.fn(), remove: vi.fn() }
    const fakeDocument = {
      createElement: vi.fn(() => downloadLink),
      body: { appendChild: vi.fn() },
    }
    const fakeUrl = { createObjectURL: vi.fn(() => 'blob:report'), revokeObjectURL: vi.fn() }
    vi.stubGlobal('document', fakeDocument)
    vi.stubGlobal('URL', fakeUrl)
    return { downloadLink, fakeDocument, fakeUrl }
  }

  it('builds a UTF-8 text Blob that starts with the BOM', async () => {
    const { fakeUrl } = stubBrowser()
    downloadCsvFile('report.csv', 'a,b')
    const csvBlob = fakeUrl.createObjectURL.mock.calls[0][0]
    const blobBytes = new Uint8Array(await csvBlob.arrayBuffer())
    expect(csvBlob.type).toBe('text/csv;charset=utf-8')
    expect(Array.from(blobBytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf])
  })

  it('clicks the link with the file name, then removes it and revokes the URL', () => {
    const { downloadLink, fakeDocument, fakeUrl } = stubBrowser()
    downloadCsvFile('report.csv', 'a,b')
    expect(downloadLink.download).toBe('report.csv')
    expect(fakeDocument.body.appendChild).toHaveBeenCalledWith(downloadLink)
    expect(downloadLink.click).toHaveBeenCalledTimes(1)
    expect(downloadLink.remove).toHaveBeenCalledTimes(1)
    expect(fakeUrl.revokeObjectURL).toHaveBeenCalledWith('blob:report')
  })

  it('does nothing for an empty file name or text', () => {
    const { downloadLink, fakeUrl } = stubBrowser()
    downloadCsvFile('', 'a,b')
    downloadCsvFile('report.csv', '')
    expect(fakeUrl.createObjectURL).not.toHaveBeenCalled()
    expect(downloadLink.click).not.toHaveBeenCalled()
  })
})
