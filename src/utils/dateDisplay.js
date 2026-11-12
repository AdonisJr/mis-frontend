const DATE_PATTERN = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/
const DISPLAY_DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

export function formatDisplayDate(isoDate) {
  const dateParts = isoDate?.match(DATE_PATTERN)?.groups
  if (!dateParts) return isoDate
  const utcTimestamp = Date.UTC(Number(dateParts.year), Number(dateParts.month) - 1, Number(dateParts.day))
  return DISPLAY_DATE_FORMAT.format(utcTimestamp)
}
