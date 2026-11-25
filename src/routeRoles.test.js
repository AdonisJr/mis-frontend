import { describe, it, expect } from 'vitest'
import { ROUTE_ROLES } from '@/routeRoles.js'
import { EMPLOYEE_ROLES, TEACHER_ROLE } from '@/utils/roleAccess.js'
import {
  CLASS_LIST_ROUTE_NAME,
  CLASS_RECORD_ROUTE_NAME,
  CLASS_SCHEDULES_ROUTE_NAME,
  MY_CLASSES_ROUTE_NAME,
  NOT_FOUND_ROUTE_NAME,
  ROOMS_ROUTE_NAME,
  REPORT_CARD_ROUTE_NAME,
  ROOT_ROUTE_NAME,
  SECTION_REPORT_CARDS_ROUTE_NAME,
} from '@/routeNames.js'

const GRADING_ROUTES = [CLASS_RECORD_ROUTE_NAME, REPORT_CARD_ROUTE_NAME, SECTION_REPORT_CARDS_ROUTE_NAME]
const TEACHER_FRIENDLY_ROUTES = [
  ROOT_ROUTE_NAME,
  NOT_FOUND_ROUTE_NAME,
  MY_CLASSES_ROUTE_NAME,
  CLASS_LIST_ROUTE_NAME,
  ...GRADING_ROUTES,
]

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
})
