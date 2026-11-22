import { describe, it, expect } from 'vitest'
import { NAV_ITEMS, buildNavRows, listVisibleNavItems } from '@/layout/sidebar/navConfig.js'
import { CLASS_SCHEDULES_ROUTE_NAME, CURRICULUM_ROUTE_NAME, ROOMS_ROUTE_NAME, SECTIONS_ROUTE_NAME } from '@/routeNames.js'

function listRouteNames(userRoles) {
  return listVisibleNavItems(NAV_ITEMS, userRoles).map((navItem) => navItem.routeName)
}

describe('listVisibleNavItems', () => {
  it('shows a teacher-only user no items and no rows', () => {
    const visibleItems = listVisibleNavItems(NAV_ITEMS, ['teacher'])
    expect(visibleItems).toEqual([])
    expect(buildNavRows(visibleItems)).toEqual([])
  })

  it('keeps the registrar menu unchanged when the user is also a teacher', () => {
    expect(listRouteNames(['registrar', 'teacher'])).toEqual(listRouteNames(['registrar']))
    expect(listRouteNames(['registrar']).length).toBeGreaterThan(0)
  })

  it('keeps the cashier menu unchanged when the user is also a teacher', () => {
    expect(listRouteNames(['cashier', 'teacher'])).toEqual(listRouteNames(['cashier']))
    expect(listRouteNames(['cashier']).length).toBeGreaterThan(0)
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

  it('returns an empty list for non-array items', () => {
    expect(listVisibleNavItems(null, ['admin'])).toEqual([])
    expect(listVisibleNavItems(undefined, ['admin'])).toEqual([])
  })
})
