import { describe, it, expect } from 'vitest'
import { ROUTE_ROLES } from '@/routeRoles.js'
import { EMPLOYEE_ROLES, TEACHER_ROLE } from '@/utils/roleAccess.js'
import {
  NOT_FOUND_ROUTE_NAME,
  ROOMS_ROUTE_NAME,
  ROOT_ROUTE_NAME,
  TEACHER_HOME_ROUTE_NAME,
} from '@/routeNames.js'

const TEACHER_FRIENDLY_ROUTES = [ROOT_ROUTE_NAME, NOT_FOUND_ROUTE_NAME, TEACHER_HOME_ROUTE_NAME]

describe('ROUTE_ROLES', () => {
  it('lets every employee role open Root and NotFound', () => {
    expect(ROUTE_ROLES[ROOT_ROUTE_NAME]).toEqual(EMPLOYEE_ROLES)
    expect(ROUTE_ROLES[NOT_FOUND_ROUTE_NAME]).toEqual(EMPLOYEE_ROLES)
  })

  it('gives the teacher home to teachers only', () => {
    expect(ROUTE_ROLES[TEACHER_HOME_ROUTE_NAME]).toEqual(['teacher'])
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
})
