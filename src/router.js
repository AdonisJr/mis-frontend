import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore.js'
import {
  ASSESSMENTS_ROUTE_NAME,
  ATTENDANCE_RECORDS_ROUTE_NAME,
  ATTENDANCE_TODAY_ROUTE_NAME,
  CHART_OF_ACCOUNTS_ROUTE_NAME,
  CLASS_LIST_ROUTE_NAME,
  CLASS_RECORD_ROUTE_NAME,
  CLASS_SCHEDULES_ROUTE_NAME,
  CURRICULUM_ROUTE_NAME,
  DASHBOARD_ROUTE_NAME,
  DISCOUNT_TYPES_ROUTE_NAME,
  EMPLOYEES_ROUTE_NAME,
  ENROLLMENT_ROUTE_NAME,
  FEE_SCHEDULES_ROUTE_NAME,
  GENERAL_LEDGER_ROUTE_NAME,
  JOURNAL_ENTRIES_ROUTE_NAME,
  JOURNAL_ENTRY_CREATE_ROUTE_NAME,
  JOURNAL_ENTRY_DETAIL_ROUTE_NAME,
  JOURNAL_ENTRY_EDIT_ROUTE_NAME,
  LOGIN_ROUTE_NAME,
  MY_CLASSES_ROUTE_NAME,
  REPORT_CARD_ROUTE_NAME,
  SECTION_REPORT_CARDS_ROUTE_NAME,
  NOT_FOUND_ROUTE_NAME,
  PAYMENTS_ROUTE_NAME,
  PAYMENT_HOLDS_ROUTE_NAME,
  PAYMENT_PLANS_ROUTE_NAME,
  PAYMENT_RECEIPT_ROUTE_NAME,
  POSTING_SETTINGS_ROUTE_NAME,
  TRIAL_BALANCE_ROUTE_NAME,
  INCOME_STATEMENT_ROUTE_NAME,
  BALANCE_SHEET_ROUTE_NAME,
  AR_AGING_ROUTE_NAME,
  PROGRAMS_ROUTE_NAME,
  RFID_CARDS_ROUTE_NAME,
  ROOMS_ROUTE_NAME,
  ROOT_ROUTE_NAME,
  SCHOOL_YEARS_ROUTE_NAME,
  SECTIONS_ROUTE_NAME,
  STATEMENT_OF_ACCOUNT_ROUTE_NAME,
  STUDENTS_ROUTE_NAME,
  STUDENT_DISCOUNTS_ROUTE_NAME,
  STUDENT_LEDGER_ROUTE_NAME,
  SUBJECTS_ROUTE_NAME,
} from '@/routeNames.js'
import { ROUTE_ROLES } from '@/routeRoles.js'

const routes = [
  { path: '/login', name: LOGIN_ROUTE_NAME, component: () => import('@/views/LoginView.vue') },
  {
    path: '/',
    component: () => import('@/layout/MainPanelLayout.vue'),
    children: [
      // the guard always redirects Root to the landing page; vue-router still requires a component on the record
      {
        path: '',
        name: ROOT_ROUTE_NAME,
        component: () => import('@/views/NotFoundView.vue'),
        meta: { roles: ROUTE_ROLES[ROOT_ROUTE_NAME] },
      },
      {
        path: 'dashboard',
        name: DASHBOARD_ROUTE_NAME,
        component: () => import('@/views/DashboardView.vue'),
        meta: { roles: ROUTE_ROLES[DASHBOARD_ROUTE_NAME], title: 'Dashboard' },
      },
      {
        path: 'students',
        name: STUDENTS_ROUTE_NAME,
        component: () => import('@/views/StudentsView.vue'),
        meta: { roles: ROUTE_ROLES[STUDENTS_ROUTE_NAME], title: 'Students' },
      },
      {
        path: 'enrollment',
        name: ENROLLMENT_ROUTE_NAME,
        component: () => import('@/views/EnrollmentView.vue'),
        meta: { roles: ROUTE_ROLES[ENROLLMENT_ROUTE_NAME], title: 'Enrollment' },
      },
      {
        path: 'employees',
        name: EMPLOYEES_ROUTE_NAME,
        component: () => import('@/views/EmployeesView.vue'),
        meta: { roles: ROUTE_ROLES[EMPLOYEES_ROUTE_NAME], title: 'Employees' },
      },
      {
        path: 'rfid-cards',
        name: RFID_CARDS_ROUTE_NAME,
        component: () => import('@/views/RfidCardsView.vue'),
        meta: { roles: ROUTE_ROLES[RFID_CARDS_ROUTE_NAME], title: 'RFID Cards' },
      },
      {
        path: 'attendance/today',
        name: ATTENDANCE_TODAY_ROUTE_NAME,
        component: () => import('@/views/AttendanceTodayView.vue'),
        meta: { roles: ROUTE_ROLES[ATTENDANCE_TODAY_ROUTE_NAME], title: 'Today' },
      },
      {
        path: 'attendance/records',
        name: ATTENDANCE_RECORDS_ROUTE_NAME,
        component: () => import('@/views/AttendanceRecordsView.vue'),
        meta: { roles: ROUTE_ROLES[ATTENDANCE_RECORDS_ROUTE_NAME], title: 'Records' },
      },
      {
        path: 'school-years',
        name: SCHOOL_YEARS_ROUTE_NAME,
        component: () => import('@/views/SchoolYearsView.vue'),
        meta: { roles: ROUTE_ROLES[SCHOOL_YEARS_ROUTE_NAME], title: 'School Years' },
      },
      {
        path: 'programs',
        name: PROGRAMS_ROUTE_NAME,
        component: () => import('@/views/ProgramsView.vue'),
        meta: { roles: ROUTE_ROLES[PROGRAMS_ROUTE_NAME], title: 'Programs' },
      },
      {
        path: 'sections',
        name: SECTIONS_ROUTE_NAME,
        component: () => import('@/views/SectionsView.vue'),
        meta: { roles: ROUTE_ROLES[SECTIONS_ROUTE_NAME], title: 'Sections' },
      },
      {
        path: 'rooms',
        name: ROOMS_ROUTE_NAME,
        component: () => import('@/views/RoomsView.vue'),
        meta: { roles: ROUTE_ROLES[ROOMS_ROUTE_NAME], title: 'Rooms' },
      },
      {
        path: 'subjects',
        name: SUBJECTS_ROUTE_NAME,
        component: () => import('@/views/SubjectsView.vue'),
        meta: { roles: ROUTE_ROLES[SUBJECTS_ROUTE_NAME], title: 'Subjects' },
      },
      {
        path: 'curriculum',
        name: CURRICULUM_ROUTE_NAME,
        component: () => import('@/views/CurriculumView.vue'),
        meta: { roles: ROUTE_ROLES[CURRICULUM_ROUTE_NAME], title: 'Curriculum' },
      },
      {
        path: 'class-schedules',
        name: CLASS_SCHEDULES_ROUTE_NAME,
        component: () => import('@/views/ClassSchedulesView.vue'),
        meta: { roles: ROUTE_ROLES[CLASS_SCHEDULES_ROUTE_NAME], title: 'Class schedules' },
      },
      {
        path: 'fee-schedules',
        name: FEE_SCHEDULES_ROUTE_NAME,
        component: () => import('@/views/FeeSchedulesView.vue'),
        meta: { roles: ROUTE_ROLES[FEE_SCHEDULES_ROUTE_NAME], title: 'Fee schedules' },
      },
      {
        path: 'payment-plans',
        name: PAYMENT_PLANS_ROUTE_NAME,
        component: () => import('@/views/PaymentPlansView.vue'),
        meta: { roles: ROUTE_ROLES[PAYMENT_PLANS_ROUTE_NAME], title: 'Payment plans' },
      },
      {
        path: 'discount-types',
        name: DISCOUNT_TYPES_ROUTE_NAME,
        component: () => import('@/views/DiscountTypesView.vue'),
        meta: { roles: ROUTE_ROLES[DISCOUNT_TYPES_ROUTE_NAME], title: 'Discount types' },
      },
      {
        path: 'student-discounts',
        name: STUDENT_DISCOUNTS_ROUTE_NAME,
        component: () => import('@/views/StudentDiscountsView.vue'),
        meta: { roles: ROUTE_ROLES[STUDENT_DISCOUNTS_ROUTE_NAME], title: 'Student discounts' },
      },
      {
        path: 'assessments',
        name: ASSESSMENTS_ROUTE_NAME,
        component: () => import('@/views/AssessmentsView.vue'),
        meta: { roles: ROUTE_ROLES[ASSESSMENTS_ROUTE_NAME], title: 'Assessments' },
      },
      {
        path: 'assessments/:assessmentId(\\d+)',
        name: STATEMENT_OF_ACCOUNT_ROUTE_NAME,
        component: () => import('@/views/StatementOfAccountView.vue'),
        meta: { roles: ROUTE_ROLES[STATEMENT_OF_ACCOUNT_ROUTE_NAME], title: 'Statement of account', isPrintable: true },
      },
      {
        path: 'payments',
        name: PAYMENTS_ROUTE_NAME,
        component: () => import('@/views/PaymentsView.vue'),
        meta: { roles: ROUTE_ROLES[PAYMENTS_ROUTE_NAME], title: 'Payments' },
      },
      {
        path: 'payments/ledger/:schoolYearId(\\d+)/:studentId(\\d+)',
        name: STUDENT_LEDGER_ROUTE_NAME,
        component: () => import('@/views/StudentLedgerView.vue'),
        meta: { roles: ROUTE_ROLES[STUDENT_LEDGER_ROUTE_NAME], title: 'Student ledger' },
      },
      {
        path: 'payments/:paymentId(\\d+)/receipt',
        name: PAYMENT_RECEIPT_ROUTE_NAME,
        component: () => import('@/views/PaymentReceiptView.vue'),
        meta: { roles: ROUTE_ROLES[PAYMENT_RECEIPT_ROUTE_NAME], title: 'Acknowledgment receipt', isPrintable: true },
      },
      {
        path: 'payment-holds',
        name: PAYMENT_HOLDS_ROUTE_NAME,
        component: () => import('@/views/PaymentHoldsView.vue'),
        meta: { roles: ROUTE_ROLES[PAYMENT_HOLDS_ROUTE_NAME], title: 'Payment holds' },
      },
      {
        path: 'accounting/chart-of-accounts',
        name: CHART_OF_ACCOUNTS_ROUTE_NAME,
        component: () => import('@/views/ChartOfAccountsView.vue'),
        meta: { roles: ROUTE_ROLES[CHART_OF_ACCOUNTS_ROUTE_NAME], title: 'Chart of accounts' },
      },
      {
        path: 'accounting/journal-entries',
        name: JOURNAL_ENTRIES_ROUTE_NAME,
        component: () => import('@/views/JournalEntriesView.vue'),
        meta: { roles: ROUTE_ROLES[JOURNAL_ENTRIES_ROUTE_NAME], title: 'Journal entries' },
      },
      {
        path: 'accounting/journal-entries/new',
        name: JOURNAL_ENTRY_CREATE_ROUTE_NAME,
        component: () => import('@/views/JournalEntryFormView.vue'),
        meta: { roles: ROUTE_ROLES[JOURNAL_ENTRY_CREATE_ROUTE_NAME], title: 'New journal entry' },
      },
      {
        path: 'accounting/journal-entries/:entryId(\\d+)',
        name: JOURNAL_ENTRY_DETAIL_ROUTE_NAME,
        component: () => import('@/views/JournalEntryDetailView.vue'),
        meta: { roles: ROUTE_ROLES[JOURNAL_ENTRY_DETAIL_ROUTE_NAME], title: 'Journal entry' },
      },
      {
        path: 'accounting/journal-entries/:entryId(\\d+)/edit',
        name: JOURNAL_ENTRY_EDIT_ROUTE_NAME,
        component: () => import('@/views/JournalEntryFormView.vue'),
        meta: { roles: ROUTE_ROLES[JOURNAL_ENTRY_EDIT_ROUTE_NAME], title: 'Edit journal entry' },
      },
      {
        path: 'accounting/general-ledger',
        name: GENERAL_LEDGER_ROUTE_NAME,
        component: () => import('@/views/GeneralLedgerView.vue'),
        meta: { roles: ROUTE_ROLES[GENERAL_LEDGER_ROUTE_NAME], title: 'General ledger' },
      },
      {
        path: 'accounting/posting-settings',
        name: POSTING_SETTINGS_ROUTE_NAME,
        component: () => import('@/views/PostingSettingsView.vue'),
        meta: { roles: ROUTE_ROLES[POSTING_SETTINGS_ROUTE_NAME], title: 'Posting settings' },
      },
      {
        path: 'accounting/trial-balance',
        name: TRIAL_BALANCE_ROUTE_NAME,
        component: () => import('@/views/TrialBalanceView.vue'),
        meta: { roles: ROUTE_ROLES[TRIAL_BALANCE_ROUTE_NAME], title: 'Trial balance', isPrintable: true },
      },
      {
        path: 'accounting/income-statement',
        name: INCOME_STATEMENT_ROUTE_NAME,
        component: () => import('@/views/IncomeStatementView.vue'),
        meta: { roles: ROUTE_ROLES[INCOME_STATEMENT_ROUTE_NAME], title: 'Income statement', isPrintable: true },
      },
      {
        path: 'accounting/balance-sheet',
        name: BALANCE_SHEET_ROUTE_NAME,
        component: () => import('@/views/BalanceSheetView.vue'),
        meta: { roles: ROUTE_ROLES[BALANCE_SHEET_ROUTE_NAME], title: 'Balance sheet', isPrintable: true },
      },
      {
        path: 'accounting/ar-aging',
        name: AR_AGING_ROUTE_NAME,
        component: () => import('@/views/ArAgingView.vue'),
        meta: { roles: ROUTE_ROLES[AR_AGING_ROUTE_NAME], title: 'AR aging', isPrintable: true },
      },
      {
        path: 'my-classes',
        name: MY_CLASSES_ROUTE_NAME,
        component: () => import('@/views/MyClassesView.vue'),
        meta: { roles: ROUTE_ROLES[MY_CLASSES_ROUTE_NAME], title: 'My classes', isPrintable: true },
      },
      {
        path: 'my-classes/classes/:classId(\\d+)',
        name: CLASS_LIST_ROUTE_NAME,
        component: () => import('@/views/ClassListView.vue'),
        meta: { roles: ROUTE_ROLES[CLASS_LIST_ROUTE_NAME], title: 'Class list', isPrintable: true },
      },
      {
        path: 'my-classes/classes/:classId(\\d+)/record',
        name: CLASS_RECORD_ROUTE_NAME,
        component: () => import('@/views/ClassRecordView.vue'),
        meta: { roles: ROUTE_ROLES[CLASS_RECORD_ROUTE_NAME], title: 'Class record', isPrintable: true },
      },
      {
        path: 'report-cards/:studentId(\\d+)',
        name: REPORT_CARD_ROUTE_NAME,
        component: () => import('@/views/ReportCardView.vue'),
        meta: { roles: ROUTE_ROLES[REPORT_CARD_ROUTE_NAME], title: 'Report card', isPrintable: true },
      },
      {
        path: 'my-classes/sections/:sectionId(\\d+)/report-cards',
        name: SECTION_REPORT_CARDS_ROUTE_NAME,
        component: () => import('@/views/SectionReportCardsView.vue'),
        meta: { roles: ROUTE_ROLES[SECTION_REPORT_CARDS_ROUTE_NAME], title: 'Report cards', isPrintable: true },
      },
      {
        path: ':pathMatch(.*)*',
        name: NOT_FOUND_ROUTE_NAME,
        component: () => import('@/views/NotFoundView.vue'),
        meta: { roles: ROUTE_ROLES[NOT_FOUND_ROUTE_NAME], title: 'Page not found' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

function endSessionAtLogin(authStore) {
  authStore.clearSession()
  return { name: LOGIN_ROUTE_NAME }
}

async function guardStaffRoutes(to) {
  const authStore = useAuthStore()
  if (!authStore.isSessionChecked) await authStore.restoreSession()
  if (!to.meta.roles) return true
  if (!authStore.isAuthenticated) return { name: LOGIN_ROUTE_NAME }
  const landingRouteName = authStore.landingRouteName
  if (!landingRouteName) return endSessionAtLogin(authStore)
  if (to.name === ROOT_ROUTE_NAME) return { name: landingRouteName }
  if (authStore.hasAnyRole(to.meta.roles)) return true
  if (to.name === landingRouteName) return endSessionAtLogin(authStore)
  return { name: landingRouteName }
}

router.beforeEach(guardStaffRoutes)

export default router
