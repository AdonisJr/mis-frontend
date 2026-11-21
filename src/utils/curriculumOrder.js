const FIRST_SORT_ORDER = 1

function findEntryIndex(entries, entryId) {
  if (!Array.isArray(entries)) return -1
  return entries.findIndex((entry) => entry.id === entryId)
}

function hasDistinctIntegerOrders(upperEntry, lowerEntry) {
  const isUpperInteger = Number.isInteger(upperEntry.sort_order)
  const isLowerInteger = Number.isInteger(lowerEntry.sort_order)
  return isUpperInteger && isLowerInteger && upperEntry.sort_order !== lowerEntry.sort_order
}

function swapAdjacent(entries, upperIndex) {
  const swappedEntries = [...entries]
  swappedEntries[upperIndex] = entries[upperIndex + 1]
  swappedEntries[upperIndex + 1] = entries[upperIndex]
  return swappedEntries
}

function buildSwapUpdates(firstEntry, secondEntry) {
  return [
    { id: firstEntry.id, sort_order: secondEntry.sort_order },
    { id: secondEntry.id, sort_order: firstEntry.sort_order },
  ]
}

// null or tied orders cannot be swapped, so the new order is numbered 1..n and only changed rows are sent
function buildRenumberUpdates(orderedEntries) {
  return orderedEntries
    .map((entry, index) => ({ id: entry.id, sort_order: index + FIRST_SORT_ORDER, previousOrder: entry.sort_order }))
    .filter((update) => update.sort_order !== update.previousOrder)
    .map((update) => ({ id: update.id, sort_order: update.sort_order }))
}

function buildAdjacentUpdates(entries, upperIndex) {
  const upperEntry = entries[upperIndex]
  const lowerEntry = entries[upperIndex + 1]
  if (hasDistinctIntegerOrders(upperEntry, lowerEntry)) return null
  return buildRenumberUpdates(swapAdjacent(entries, upperIndex))
}

export function isFirstEntry(entries, entryId) {
  return findEntryIndex(entries, entryId) === 0
}

export function isLastEntry(entries, entryId) {
  if (!Array.isArray(entries)) return false
  return findEntryIndex(entries, entryId) === entries.length - 1
}

export function buildMoveUpUpdates(entries, entryId) {
  const entryIndex = findEntryIndex(entries, entryId)
  if (entryIndex < 1) return []
  const renumberUpdates = buildAdjacentUpdates(entries, entryIndex - 1)
  if (renumberUpdates !== null) return renumberUpdates
  return buildSwapUpdates(entries[entryIndex], entries[entryIndex - 1])
}

export function buildMoveDownUpdates(entries, entryId) {
  const entryIndex = findEntryIndex(entries, entryId)
  if (entryIndex === -1 || entryIndex === entries.length - 1) return []
  const renumberUpdates = buildAdjacentUpdates(entries, entryIndex)
  if (renumberUpdates !== null) return renumberUpdates
  return buildSwapUpdates(entries[entryIndex], entries[entryIndex + 1])
}
