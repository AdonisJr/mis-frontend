import { describe, it, expect } from 'vitest'
import { ROUTE_ROLES } from '@/routeRoles.js'
import { ACCOUNTANT_ROLE, EMPLOYEE_ROLES, TEACHER_ROLE } from '@/utils/roleAccess.js'
import {
  ASSESSMENTS_ROUTE_NAME,
  CHART_OF_ACCOUNTS_ROUTE_NAME,
  CLASS_LIST_ROUTE_NAME,
  CLASS_RECORD_ROUTE_NAME,
  CLASS_SCHEDULES_ROUTE_NAME,
  GENERAL_LEDGER_ROUTE_NAME,
  JOURNAL_ENTRIES_ROUTE_NAME,
  JOURNAL_ENTRY_CREATE_ROUTE_NAME,
  JOURNAL_ENTRY_DETAIL_ROUTE_NAME,
  JOURNAL_ENTRY_EDIT_ROUTE_NAME,
  MY_CLASSES_ROUTE_NAME,
  NOT_FOUND_ROUTE_NAME,
  PAYMENTS_ROUTE_NAME,
  PAYMENT_RECEIPT_ROUTE_NAME,
  POSTING_SETTINGS_ROUTE_NAME,
  TRIAL_BALANCE_ROUTE_NAME,
  INCOME_STATEMENT_ROUTE_NAME,
  BALANCE_SHEET_ROUTE_NAME,
  AR_AGING_ROUTE_NAME,
  ROOMS_ROUTE_NAME,
  REPORT_CARD_ROUTE_NAME,
  ROOT_ROUTE_NAME,
  SECTION_REPORT_CARDS_ROUTE_NAME,
  STATEMENT_OF_ACCOUNT_ROUTE_NAME,
  STUDENT_LEDGER_ROUTE_NAME,
} from '@/routeNames.js'

const GRADING_ROUTES = [CLASS_RECORD_ROUTE_NAME, REPORT_CARD_ROUTE_NAME, SECTION_REPORT_CARDS_ROUTE_NAME]
const TEACHER_FRIENDLY_ROUTES = [
  ROOT_ROUTE_NAME,
  NOT_FOUND_ROUTE_NAME,
  MY_CLASSES_ROUTE_NAME,
  CLASS_LIST_ROUTE_NAME,
  ...GRADING_ROUTES,
]

const BILLING_READ_ROUTES = [
  ASSESSMENTS_ROUTE_NAME,
  STATEMENT_OF_ACCOUNT_ROUTE_NAME,
  PAYMENTS_ROUTE_NAME,
  STUDENT_LEDGER_ROUTE_NAME,
  PAYMENT_RECEIPT_ROUTE_NAME,
]
const ACCOUNTING_ROUTES = [
  CHART_OF_ACCOUNTS_ROUTE_NAME,
  JOURNAL_ENTRIES_ROUTE_NAME,
  JOURNAL_ENTRY_CREATE_ROUTE_NAME,
  JOURNAL_ENTRY_DETAIL_ROUTE_NAME,
  JOURNAL_ENTRY_EDIT_ROUTE_NAME,
  GENERAL_LEDGER_ROUTE_NAME,
  POSTING_SETTINGS_ROUTE_NAME,
  TRIAL_BALANCE_ROUTE_NAME,
  INCOME_STATEMENT_ROUTE_NAME,
  BALANCE_SHEET_ROUTE_NAME,
  AR_AGING_ROUTE_NAME,
]
const REPORT_ROUTES = [
  TRIAL_BALANCE_ROUTE_NAME,
  INCOME_STATEMENT_ROUTE_NAME,
  BALANCE_SHEET_ROUTE_NAME,
  AR_AGING_ROUTE_NAME,
]
const ACCOUNTANT_ROUTES = [ROOT_ROUTE_NAME, NOT_FOUND_ROUTE_NAME, ...ACCOUNTING_ROUTES, ...BILLING_READ_ROUTES]

describe('ROUTE_ROLES', () => {
  it('lets every employee role open Root and NotFound', () => {
    expect(ROUTE_ROLES[ROOT_ROUTE_NAME]).toEqual(EMPLOYEE_ROLES)
    expect(ROUTE_ROLES[NOT_FOUND_ROUTE_NAME]).toEqual(EMPLOYEE_ROLES)
  })

  it('gives My classes and the class list to admin, registrar and teacher', () => {
    expect(ROUTE_ROLES[MY_CLASSES_ROUTE_NAME]).toEqual(['admin', 'registrar', 'teacher'])
    expect(ROUTE_ROLES[CLASS_LIST_ROUTE_NAME]).toEqual(['admin', 'registrar', 'teacher'])
  })

  it('keeps the cashier out of My classes and the class list', () => {
    expect(ROUTE_ROLES[MY_CLASSES_ROUTE_NAME]).not.toContain('cashier')
    expect(ROUTE_ROLES[CLASS_LIST_ROUTE_NAME]).not.toContain('cashier')
  })

  it('gives the class record and report card routes to admin, registrar and teacher, never the cashier', () => {
    for (const routeName of GRADING_ROUTES) {
      expect(ROUTE_ROLES[routeName]).toEqual(['admin', 'registrar', 'teacher'])
      expect(ROUTE_ROLES[routeName]).not.toContain('cashier')
    }
  })

  it('keeps teacher out of every other route', () => {
    const otherRouteNames = Object.keys(ROUTE_ROLES).filter((routeName) => !TEACHER_FRIENDLY_ROUTES.includes(routeName))
    for (const routeName of otherRouteNames) {
      expect(ROUTE_ROLES[routeName]).not.toContain(TEACHER_ROLE)
    }
  })

  it('limits Rooms to admin', () => {
    expect(ROUTE_ROLES[ROOMS_ROUTE_NAME]).toEqual(['admin'])
  })

  it('limits Class schedules to admin and registrar', () => {
    expect(ROUTE_ROLES[CLASS_SCHEDULES_ROUTE_NAME]).toEqual(['admin', 'registrar'])
  })

  it('limits the chart of accounts to admin and accountant', () => {
    expect(ROUTE_ROLES[CHART_OF_ACCOUNTS_ROUTE_NAME]).toEqual(['admin', 'accountant'])
  })

  it('limits Posting settings to admin and accountant', () => {
    expect(ROUTE_ROLES[POSTING_SETTINGS_ROUTE_NAME]).toEqual(['admin', 'accountant'])
    expect(ROUTE_ROLES[POSTING_SETTINGS_ROUTE_NAME]).not.toContain('registrar')
    expect(ROUTE_ROLES[POSTING_SETTINGS_ROUTE_NAME]).not.toContain('cashier')
    expect(ROUTE_ROLES[POSTING_SETTINGS_ROUTE_NAME]).not.toContain('teacher')
  })

  it('limits the journal and general ledger routes to admin and accountant', () => {
    for (const routeName of ACCOUNTING_ROUTES) {
      expect(ROUTE_ROLES[routeName]).toEqual(['admin', 'accountant'])
      expect(ROUTE_ROLES[routeName]).not.toContain('registrar')
      expect(ROUTE_ROLES[routeName]).not.toContain('cashier')
      expect(ROUTE_ROLES[routeName]).not.toContain('teacher')
    }
  })

  it('limits the four report routes to admin and accountant', () => {
    for (const routeName of REPORT_ROUTES) {
      expect(ROUTE_ROLES[routeName]).toEqual(['admin', 'accountant'])
      expect(ROUTE_ROLES[routeName]).not.toContain('registrar')
      expect(ROUTE_ROLES[routeName]).not.toContain('cashier')
      expect(ROUTE_ROLES[routeName]).not.toContain('teacher')
    }
  })

  it('gives the five read-only Billing routes to admin, registrar, cashier and accountant', () => {
    for (const routeName of BILLING_READ_ROUTES) {
      expect(ROUTE_ROLES[routeName]).toEqual(['admin', 'registrar', 'cashier', 'accountant'])
    }
  })

  it('keeps accountant out of every other route, Payment holds included', () => {
    const otherRouteNames = Object.keys(ROUTE_ROLES).filter((routeName) => !ACCOUNTANT_ROUTES.includes(routeName))
    expect(otherRouteNames).toContain('PaymentHolds')
    for (const routeName of otherRouteNames) {
      expect(ROUTE_ROLES[routeName]).not.toContain(ACCOUNTANT_ROLE)
    }
  })
})
