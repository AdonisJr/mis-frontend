<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import AdvisorySectionBlock from '@/components/AdvisorySectionBlock.vue'
import ClassListFilterBar from '@/components/ClassListFilterBar.vue'
import MyClassList from '@/components/MyClassList.vue'
import TimetableGrid from '@/components/TimetableGrid.vue'
import { fetchAdvisorySection, fetchMyClasses } from '@/services/classListService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { fetchSchoolYears } from '@/services/schoolYearService.js'
import { fetchActiveTeachers } from '@/services/teacherService.js'
import { ADMIN_REGISTRAR_ROLES } from '@/routeRoles.js'
import { useAuthStore } from '@/stores/authStore.js'
import { useSchoolYearStore } from '@/stores/schoolYearStore.js'
import { buildAdvisoryBlock, buildMyTimetableEntries, listMyClassRows } from '@/utils/classListDisplay.js'
import { buildAdvisoryPrintHeaderItems } from '@/utils/classListPrint.js'
import {
  applyClassListSchoolYearChange,
  applyClassListTeacherChange,
  applyClassListTermChange,
  buildClassListParams,
  buildClassListQuery,
  createClassListFilters,
  pickDefaultTermNumber,
  readClassListQuery,
} from '@/utils/classListSearch.js'
import { buildRosterColumns, hasGuardianFields } from '@/utils/rosterDisplay.js'
import { toRecordId } from '@/utils/sectionForm.js'
import { pickDefaultSchoolYearId } from '@/utils/sectionSearch.js'
import { getTermNumberOptions } from '@/utils/termForm.js'

const MY_CLASSES_TITLE = 'My classes'
const WEEK_TITLE = 'Week'
const NO_SCHOOL_YEAR_TEXT = 'Add a school year first.'
const CHOOSE_TEACHER_TEXT = 'Choose a teacher.'
const NO_CLASSES_TEXT = 'No classes for this school year and term.'
const NO_MEETINGS_TEXT = 'No meetings this week.'

const SCHOOL_YEARS_FAILED_MESSAGE = 'Could not load school years.'
const TEACHERS_FAILED_MESSAGE = 'Could not load teachers.'
const ACTIVE_PERIOD_FAILED_MESSAGE = 'Could not load the active school year or term.'
const CLASSES_FAILED_MESSAGE = 'Could not load the classes.'
const ADVISORY_FAILED_MESSAGE = 'Could not load the advisory section.'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const schoolYearStore = useSchoolYearStore()

const schoolYears = ref([])
const teachers = ref([])
const areSchoolYearsLoaded = ref(false)
const isInitializing = ref(true)
const filters = ref(createClassListFilters())
const classes = ref([])
const advisoryBlock = ref(null)
const isClassesLoading = ref(false)
let listRequestId = 0

const canPickTeacher = computed(() => authStore.hasAnyRole(ADMIN_REGISTRAR_ROLES))
const selectedSchoolYear = computed(
  () => schoolYears.value.find((schoolYear) => schoolYear.id === toRecordId(filters.value.schoolYearId)) ?? null,
)
const selectedTeacher = computed(
  () => teachers.value.find((teacher) => teacher.id === toRecordId(filters.value.teacherId)) ?? null,
)
const termOptions = computed(() => getTermNumberOptions(selectedSchoolYear.value?.term_type))
const classListParams = computed(() => buildClassListParams(filters.value, canPickTeacher.value))
const linkQuery = computed(() => buildClassListQuery(filters.value))
const classRows = computed(() => listMyClassRows(classes.value))
const timetableEntries = computed(() => buildMyTimetableEntries(classes.value))
const rosterColumns = computed(() => buildRosterColumns(hasGuardianFields(advisoryBlock.value?.rosterGroups)))
const printHeaderItems = computed(() => buildAdvisoryPrintHeaderItems(advisoryBlock.value, selectedSchoolYear.value))
const choosePromptText = computed(() => {
  if (areSchoolYearsLoaded.value && schoolYears.value.length === 0) return NO_SCHOOL_YEAR_TEXT
  if (canPickTeacher.value && toRecordId(filters.value.teacherId) === null) return CHOOSE_TEACHER_TEXT
  return ''
})
const listEmptyText = computed(() => choosePromptText.value || NO_CLASSES_TEXT)
const gridEmptyText = computed(() => choosePromptText.value || NO_MEETINGS_TEXT)

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadSchoolYears() {
  try {
    const schoolYearResponse = await fetchSchoolYears()
    schoolYears.value = schoolYearResponse?.school_years ?? []
    areSchoolYearsLoaded.value = true
  } catch (error) {
    toastRequestError(error, SCHOOL_YEARS_FAILED_MESSAGE)
  }
}

async function loadTeachers() {
  if (!canPickTeacher.value) return
  try {
    const teacherResponse = await fetchActiveTeachers()
    teachers.value = teacherResponse?.teachers ?? []
  } catch (error) {
    toastRequestError(error, TEACHERS_FAILED_MESSAGE)
  }
}

async function loadActivePeriodSafely() {
  try {
    await schoolYearStore.loadActivePeriod()
  } catch (error) {
    toastRequestError(error, ACTIVE_PERIOD_FAILED_MESSAGE)
  }
}

function buildDefaultFilters() {
  const defaultYearId = pickDefaultSchoolYearId(schoolYears.value, schoolYearStore.activeSchoolYear)
  const defaultYear = schoolYears.value.find((schoolYear) => String(schoolYear.id) === defaultYearId) ?? null
  return {
    ...createClassListFilters(),
    schoolYearId: defaultYearId,
    termNumber: pickDefaultTermNumber(defaultYear, schoolYearStore.activeTerm),
  }
}

function buildQueryFilters() {
  const queryFilters = readClassListQuery(route.query)
  const queryYear = schoolYears.value.find((schoolYear) => schoolYear.id === toRecordId(queryFilters.schoolYearId))
  if (!queryYear) return null
  return {
    schoolYearId: queryFilters.schoolYearId,
    termNumber: queryFilters.termNumber || pickDefaultTermNumber(queryYear, schoolYearStore.activeTerm),
    teacherId: canPickTeacher.value ? queryFilters.teacherId : '',
  }
}

function initFilters() {
  filters.value = buildQueryFilters() ?? buildDefaultFilters()
}

async function loadMyClasses(requestId, params) {
  try {
    const classesResponse = await fetchMyClasses(params)
    if (requestId !== listRequestId) return
    classes.value = classesResponse?.classes ?? []
  } catch (error) {
    if (requestId !== listRequestId) return
    classes.value = []
    toastRequestError(error, CLASSES_FAILED_MESSAGE)
  } finally {
    if (requestId === listRequestId) isClassesLoading.value = false
  }
}

async function loadAdvisory(requestId, params) {
  try {
    const advisoryResponse = await fetchAdvisorySection(params)
    if (requestId !== listRequestId) return
    advisoryBlock.value = buildAdvisoryBlock(advisoryResponse)
  } catch (error) {
    if (requestId !== listRequestId) return
    advisoryBlock.value = null
    toastRequestError(error, ADVISORY_FAILED_MESSAGE)
  }
}

async function loadClassLists() {
  const requestId = ++listRequestId
  const params = classListParams.value
  if (params === null) {
    classes.value = []
    advisoryBlock.value = null
    isClassesLoading.value = false
    return
  }
  isClassesLoading.value = true
  await Promise.all([loadMyClasses(requestId, params), loadAdvisory(requestId, params)])
}

function applyFilterChange(nextFilters) {
  filters.value = nextFilters
  router.replace({ query: buildClassListQuery(nextFilters) })
  loadClassLists()
}

function changeSchoolYear(nextSchoolYearId) {
  const nextSchoolYear = schoolYears.value.find((schoolYear) => schoolYear.id === toRecordId(nextSchoolYearId))
  applyFilterChange(applyClassListSchoolYearChange(filters.value, nextSchoolYear))
}

function changeTerm(nextTermNumber) {
  applyFilterChange(applyClassListTermChange(filters.value, nextTermNumber))
}

function changeTeacher(nextTeacherId) {
  applyFilterChange(applyClassListTeacherChange(filters.value, nextTeacherId))
}

function printAdvisory() {
  window.print()
}

async function initialize() {
  await Promise.all([loadSchoolYears(), loadTeachers(), loadActivePeriodSafely()])
  initFilters()
  isInitializing.value = false
  await loadClassLists()
}

onMounted(initialize)
</script>

<template>
  <section class="rounded-lg border border-line bg-surface print:hidden">
    <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line px-4 py-3">
      <h2 class="text-sm font-bold text-ink">{{ MY_CLASSES_TITLE }}</h2>
      <span v-if="canPickTeacher && selectedTeacher" class="text-sm text-ink-muted">{{ selectedTeacher.name }}</span>
    </div>
    <ClassListFilterBar
      :school-year-id="filters.schoolYearId"
      :term-number="filters.termNumber"
      :teacher-id="filters.teacherId"
      :school-years="schoolYears"
      :term-options="termOptions"
      :teachers="teachers"
      :is-teacher-picker-visible="canPickTeacher"
      :is-disabled="isInitializing"
      @update:school-year-id="changeSchoolYear"
      @update:term-number="changeTerm"
      @update:teacher-id="changeTeacher"
    />
    <MyClassList
      :rows="classRows"
      :is-loading="isClassesLoading || isInitializing"
      :empty-text="listEmptyText"
      :link-query="linkQuery"
    />
  </section>

  <section class="rounded-lg border border-line bg-surface print:hidden">
    <div class="border-b border-line px-4 py-3">
      <h2 class="text-sm font-bold text-ink">{{ WEEK_TITLE }}</h2>
    </div>
    <TimetableGrid
      :entries="timetableEntries"
      :is-loading="isClassesLoading || isInitializing"
      :empty-text="gridEmptyText"
    />
  </section>

  <AdvisorySectionBlock
    v-if="advisoryBlock"
    :advisory-block="advisoryBlock"
    :roster-columns="rosterColumns"
    :print-header-items="printHeaderItems"
    :link-query="linkQuery"
    @print="printAdvisory"
  />
</template>
