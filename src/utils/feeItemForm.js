export const FEE_ITEM_CATEGORY_TUITION = 'tuition'
export const FEE_ITEM_CATEGORY_MISCELLANEOUS = 'miscellaneous'
export const FEE_ITEM_CATEGORY_OTHER = 'other'
export const FEE_ITEM_NAME_MAX_LENGTH = 255
export const FEE_ITEM_DESCRIPTION_MAX_LENGTH = 1000

export const FEE_ITEM_CATEGORIES = Object.freeze([
  FEE_ITEM_CATEGORY_TUITION,
  FEE_ITEM_CATEGORY_MISCELLANEOUS,
  FEE_ITEM_CATEGORY_OTHER,
])

export const FEE_ITEM_CATEGORY_LABELS = Object.freeze({
  [FEE_ITEM_CATEGORY_TUITION]: 'Tuition',
  [FEE_ITEM_CATEGORY_MISCELLANEOUS]: 'Miscellaneous',
  [FEE_ITEM_CATEGORY_OTHER]: 'Other',
})

export const FEE_ITEM_CATEGORY_OPTIONS = Object.freeze(
  FEE_ITEM_CATEGORIES.map((categoryValue) =>
    Object.freeze({ value: categoryValue, label: FEE_ITEM_CATEGORY_LABELS[categoryValue] }),
  ),
)

export const FEE_ITEM_FIELD_LABELS = Object.freeze({
  name: 'Name',
  category: 'Category',
  description: 'Description',
})

const NAME_REQUIRED_MESSAGE = 'Name is required.'
const NAME_TOO_LONG_MESSAGE = `Name must be at most ${FEE_ITEM_NAME_MAX_LENGTH} characters.`
const CATEGORY_REQUIRED_MESSAGE = 'Category is required.'
const DESCRIPTION_TOO_LONG_MESSAGE = `Description must be at most ${FEE_ITEM_DESCRIPTION_MAX_LENGTH} characters.`

function toTrimmedText(fieldValue) {
  if (fieldValue === null || fieldValue === undefined) return ''
  return String(fieldValue).trim()
}

function isFeeItemCategory(categoryValue) {
  return FEE_ITEM_CATEGORIES.includes(categoryValue)
}

function isFeeItemObject(feeItem) {
  return feeItem !== null && typeof feeItem === 'object'
}

export function getCategoryLabel(category) {
  if (typeof category !== 'string') return ''
  if (!isFeeItemCategory(category)) return category
  return FEE_ITEM_CATEGORY_LABELS[category]
}

export function createEmptyFeeItemForm() {
  return { name: '', category: '', description: '' }
}

export function buildFormFromFeeItem(feeItem) {
  if (!isFeeItemObject(feeItem)) return createEmptyFeeItemForm()
  return {
    name: feeItem.name ?? '',
    category: isFeeItemCategory(feeItem.category) ? feeItem.category : '',
    description: feeItem.description ?? '',
  }
}

export function findFeeItemFormErrors(formValues) {
  const formErrors = {}
  const nameText = toTrimmedText(formValues?.name)
  if (nameText === '') formErrors.name = [NAME_REQUIRED_MESSAGE]
  if (nameText.length > FEE_ITEM_NAME_MAX_LENGTH) formErrors.name = [NAME_TOO_LONG_MESSAGE]
  if (!isFeeItemCategory(formValues?.category)) formErrors.category = [CATEGORY_REQUIRED_MESSAGE]
  if (toTrimmedText(formValues?.description).length > FEE_ITEM_DESCRIPTION_MAX_LENGTH) {
    formErrors.description = [DESCRIPTION_TOO_LONG_MESSAGE]
  }
  return formErrors
}

export function buildFeeItemPayload(formValues) {
  const descriptionText = toTrimmedText(formValues?.description)
  return {
    name: toTrimmedText(formValues?.name),
    category: toTrimmedText(formValues?.category),
    description: descriptionText === '' ? null : descriptionText,
  }
}

export function buildFeeItemDeactivateMessage(feeItem) {
  if (!isFeeItemObject(feeItem)) return ''
  return `Deactivate ${feeItem.name}? It stays on existing schedules but cannot be added to new lines.`
}

export function buildFeeItemReactivateMessage(feeItem) {
  if (!isFeeItemObject(feeItem)) return ''
  return `Reactivate ${feeItem.name}? It can be added to schedule lines again.`
}
