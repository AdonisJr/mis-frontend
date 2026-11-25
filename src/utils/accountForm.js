import { ACCOUNT_TYPES, isSubtypeFit } from '@/utils/accountDisplay.js'

export const ACCOUNT_CODE_MIN_LENGTH = 4
export const ACCOUNT_CODE_MAX_LENGTH = 10
export const ACCOUNT_NAME_MAX_LENGTH = 150

export const ACCOUNT_FIELD_LABELS = Object.freeze({
  code: 'Code',
  name: 'Name',
  type: 'Type',
  subtype: 'Subtype',
  is_contra: 'Contra account',
  description: 'Description',
})

const CODE_PATTERN = /^\d+$/
const CODE_REQUIRED_MESSAGE = 'Code is required.'
const CODE_DIGITS_MESSAGE = 'Code must contain digits only.'
const CODE_LENGTH_MESSAGE = 'Code must be 4 to 10 digits.'
const NAME_REQUIRED_MESSAGE = 'Name is required.'
const NAME_TOO_LONG_MESSAGE = 'Name must be at most 150 characters.'
const TYPE_REQUIRED_MESSAGE = 'Type is required.'
const SUBTYPE_REQUIRED_MESSAGE = 'Select a subtype for this type.'

function toTrimmedText(fieldValue) {
  return typeof fieldValue === 'string' ? fieldValue.trim() : ''
}

function isAccountObject(account) {
  return account !== null && typeof account === 'object'
}

function isAccountType(accountType) {
  return ACCOUNT_TYPES.includes(accountType)
}

export function createEmptyAccountForm() {
  return { code: '', name: '', type: '', subtype: '', is_contra: false, description: '' }
}

export function buildFormFromAccount(account) {
  if (!isAccountObject(account)) return createEmptyAccountForm()
  const accountType = isAccountType(account.type) ? account.type : ''
  return {
    code: account.code ?? '',
    name: account.name ?? '',
    type: accountType,
    subtype: isSubtypeFit(accountType, account.subtype) ? account.subtype : '',
    is_contra: account.is_contra === true,
    description: account.description ?? '',
  }
}

export function applyAccountFormTypeChange(formValues, nextType) {
  const nextForm = { ...formValues, type: nextType }
  if (!isSubtypeFit(nextType, formValues?.subtype)) nextForm.subtype = ''
  return nextForm
}

function findCodeError(codeValue) {
  const codeText = toTrimmedText(codeValue)
  if (codeText === '') return CODE_REQUIRED_MESSAGE
  if (!CODE_PATTERN.test(codeText)) return CODE_DIGITS_MESSAGE
  if (codeText.length < ACCOUNT_CODE_MIN_LENGTH || codeText.length > ACCOUNT_CODE_MAX_LENGTH) return CODE_LENGTH_MESSAGE
  return ''
}

function findNameError(nameValue) {
  const nameText = toTrimmedText(nameValue)
  if (nameText === '') return NAME_REQUIRED_MESSAGE
  if (nameText.length > ACCOUNT_NAME_MAX_LENGTH) return NAME_TOO_LONG_MESSAGE
  return ''
}

export function findAccountFormErrors(formValues) {
  const formErrors = {}
  const codeError = findCodeError(formValues?.code)
  const nameError = findNameError(formValues?.name)
  if (codeError !== '') formErrors.code = [codeError]
  if (nameError !== '') formErrors.name = [nameError]
  if (!isAccountType(formValues?.type)) formErrors.type = [TYPE_REQUIRED_MESSAGE]
  else if (!isSubtypeFit(formValues.type, formValues.subtype)) formErrors.subtype = [SUBTYPE_REQUIRED_MESSAGE]
  return formErrors
}

export function buildAccountPayload(formValues) {
  const trimmedDescription = toTrimmedText(formValues?.description)
  return {
    code: toTrimmedText(formValues?.code),
    name: toTrimmedText(formValues?.name),
    type: toTrimmedText(formValues?.type),
    subtype: toTrimmedText(formValues?.subtype),
    is_contra: formValues?.is_contra === true,
    description: trimmedDescription === '' ? null : trimmedDescription,
  }
}
