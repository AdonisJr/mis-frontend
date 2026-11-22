import { describe, it, expect } from 'vitest'
import { NAV_ITEMS, buildNavRows, listVisibleNavItems } from '@/layout/sidebar/navConfig.js'
import {
  CLASS_SCHEDULES_ROUTE_NAME,
  CURRICULUM_ROUTE_NAME,
  MY_CLASSES_ROUTE_NAME,
  ROOMS_ROUTE_NAME,
  SECTIONS_ROUTE_NAME,
} from '@/routeNames.js'

function listRouteNames(userRoles) {
  return listVisibleNavItems(NAV_ITEMS, userRoles).map((navItem) => navItem.routeName)
}

describe('listVisibleNavItems', () => {
  it('shows a teacher-only user only My classes under Academics', () => {
    const visibleItems = listVisibleNavItems(NAV_ITEMS, ['teacher'])
    expect(visibleItems.map((navItem) => navItem.routeName)).toEqual([MY_CLASSES_ROUTE_NAME])
    expect(buildNavRows(visibleItems).map((navRow) => navRow.key)).toEqual(['heading-Academics', MY_CLASSES_ROUTE_NAME])
  })

  it('keeps the registrar menu unchanged when the user is also a teacher', () => {
    expect(listRouteNames(['registrar', 'teacher'])).toEqual(listRouteNames(['registrar']))
    expect(listRouteNames(['registrar']).length).toBeGreaterThan(0)
  })

  it('adds only My classes to the cashier menu when the user is also a teacher', () => {
    const cashierRouteNames = listRouteNames(['cashier'])
    expect(cashierRouteNames.length).toBeGreaterThan(0)
    expect(listRouteNames(['cashier', 'teacher']).filter((routeName) => routeName !== MY_CLASSES_ROUTE_NAME)).toEqual(cashierRouteNames)
    expect(listRouteNames(['cashier', 'teacher'])).toContain(MY_CLASSES_ROUTE_NAME)
  })

  it('puts Rooms right after Sections in Setup, for admin only', () => {
    const sectionsIndex = NAV_ITEMS.findIndex((navItem) => navItem.routeName === SECTIONS_ROUTE_NAME)
    const roomsItem = NAV_ITEMS[sectionsIndex + 1]
    expect(roomsItem.routeName).toBe(ROOMS_ROUTE_NAME)
    expect(roomsItem.group).toBe('Setup')
    expect(listRouteNames(['admin'])).toContain(ROOMS_ROUTE_NAME)
    expect(listRouteNames(['registrar'])).not.toContain(ROOMS_ROUTE_NAME)
  })

  it('puts Class schedules right after Curriculum in Academics, for admin and registrar', () => {
    const curriculumIndex = NAV_ITEMS.findIndex((navItem) => navItem.routeName === CURRICULUM_ROUTE_NAME)
    const classSchedulesItem = NAV_ITEMS[curriculumIndex + 1]
    expect(classSchedulesItem.routeName).toBe(CLASS_SCHEDULES_ROUTE_NAME)
    expect(classSchedulesItem.group).toBe('Academics')
    expect(listRouteNames(['admin'])).toContain(CLASS_SCHEDULES_ROUTE_NAME)
    expect(listRouteNames(['registrar'])).toContain(CLASS_SCHEDULES_ROUTE_NAME)
    expect(listRouteNames(['cashier'])).not.toContain(CLASS_SCHEDULES_ROUTE_NAME)
    expect(listRouteNames(['teacher'])).not.toContain(CLASS_SCHEDULES_ROUTE_NAME)
  })

  it('puts My classes right after Class schedules in Academics, for admin, registrar and teacher', () => {
    const classSchedulesIndex = NAV_ITEMS.findIndex((navItem) => navItem.routeName === CLASS_SCHEDULES_ROUTE_NAME)
    const myClassesItem = NAV_ITEMS[classSchedulesIndex + 1]
    expect(myClassesItem.routeName).toBe(MY_CLASSES_ROUTE_NAME)
    expect(myClassesItem.group).toBe('Academics')
    expect(listRouteNames(['admin'])).toContain(MY_CLASSES_ROUTE_NAME)
    expect(listRouteNames(['registrar'])).toContain(MY_CLASSES_ROUTE_NAME)
    expect(listRouteNames(['teacher'])).toContain(MY_CLASSES_ROUTE_NAME)
    expect(listRouteNames(['cashier'])).not.toContain(MY_CLASSES_ROUTE_NAME)
  })

  it('returns an empty list for non-array items', () => {
    expect(listVisibleNavItems(null, ['admin'])).toEqual([])
    expect(listVisibleNavItems(undefined, ['admin'])).toEqual([])
  })
})
