import { FEE_ITEM_CATEGORIES, getCategoryLabel } from '@/utils/feeItemForm.js'
import { toCents } from '@/utils/moneyDisplay.js'
import { toRecordId } from '@/utils/sectionForm.js'

function createZeroTotals() {
  const subtotals = Object.fromEntries(FEE_ITEM_CATEGORIES.map((category) => [category, 0]))
  return { subtotals, total: 0 }
}

function buildItemCategoryMap(feeItems) {
  const itemCategoryMap = new Map()
  if (!Array.isArray(feeItems)) return itemCategoryMap
  feeItems.forEach((feeItem) => itemCategoryMap.set(toRecordId(feeItem?.id), feeItem?.category))
  return itemCategoryMap
}

export function sumScheduleLines(lines, feeItems) {
  const lineTotals = createZeroTotals()
  if (!Array.isArray(lines)) return lineTotals
  const itemCategoryMap = buildItemCategoryMap(feeItems)
  for (const line of lines) {
    const category = itemCategoryMap.get(toRecordId(line?.fee_item_id))
    const cents = toCents(line?.amount)
    if (!Object.hasOwn(lineTotals.subtotals, category)) continue
    if (cents === null || cents <= 0) continue
    lineTotals.subtotals[category] += cents
    lineTotals.total += cents
  }
  return lineTotals
}

export function listCategoryTotals(lineTotals) {
  return FEE_ITEM_CATEGORIES.map((category) => ({
    category,
    label: getCategoryLabel(category),
    cents: lineTotals?.subtotals?.[category] ?? 0,
  }))
}
