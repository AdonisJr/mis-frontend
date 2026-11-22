<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import TabList from '@/components/TabList.vue'
import ClassScheduleList from '@/components/ClassScheduleList.vue'
import ScheduleFilterBar from '@/components/ScheduleFilterBar.vue'
import TimetableGrid from '@/components/TimetableGrid.vue'
import ConfirmDialog from '@/components/modal/ConfirmDialog.vue'
import ClassFormModalView from '@/views/ClassFormModalView.vue'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { fetchSchoolYears } from '@/services/schoolYearService.js'
import { fetchAllSections } from '@/services/sectionService.js'
import { fetchActiveRooms } from '@/services/roomService.js'
import {
  deleteClass,
  fetchRoomTimetable,
  fetchSectionTimetable,
  fetchTeacherTimetable,
} from '@/services/scheduleService.js'
import { fetchActiveTeachers } from '@/services/teacherService.js'
import { useSchoolYearStore } from '@/stores/schoolYearStore.js'
import { buildRoomOptionLabel } from '@/utils/roomDisplay.js'
import {
  buildClassDeleteMessage,
  buildRoomTimetableEntries,
  buildSectionOptionLabel,
  buildSectionTimetableEntries,
  buildTeacherTimetableEntries,
  listScheduleRows,
} from '@/utils/scheduleDisplay.js'
import {
  SCHEDULE_MODE_ROOM,
  SCHEDULE_MODE_SECTION,
  SCHEDULE_MODE_TABS,
  SCHEDULE_MODE_TEACHER,
  applyScheduleModeChange,
  applyScheduleRoomChange,
  applyScheduleSchoolYearChange,
  applyScheduleSectionChange,
  applyScheduleTeacherChange,
  applyScheduleTermChange,
  buildTimetableRequest,
  createScheduleFilters,
  isScheduleTermVisible,
} from '@/utils/scheduleSearch.js'
import { toRecordId } from '@/utils/sectionForm.js'
import { pickDefaultSchoolYearId } from '@/utils/sectionSearch.js'
import { getTermNumberOptions } from '@/utils/termForm.js'

const MODE_ID_PREFIX = 'schedule-mode'
const DELETE_TITLE = 'Delete class'
const DELETE_CONFIRM_LABEL = 'Delete'
const NO_SCHOOL_YEAR_TEXT = 'Add a school year first.'
const CHOOSE_SECTION_TEXT = 'Choose a section.'
const CHOOSE_TERM_TEXT = 'Choose a term.'
const CHOOSE_TEACHER_TEXT = 'Choose a teacher.'
const CHOOSE_ROOM_TEXT = 'Choose a room.'
const EMPTY_SUBJECTS_TEXT = 'This section has no curriculum subjects for this term yet.'
const NO_MEETINGS_TEXT = 'No meetings this week.'
const OPTIONS_FAILED_TEXT = 'The filters could not be loaded. Reload the page to try again.'

const OPTIONS_FAILED_MESSAGE = 'Could not load school years, teachers or rooms.'
const SECTIONS_FAILED_MESSAGE = 'Could not load sections.'
const LOAD_FAILED_MESSAGE = 'Could not load the timetable.'
const DELETE_SUCCESS_MESSAGE = 'Class deleted.'
const DELETE_FAILED_MESSAGE = 'Could not delete the class.'

const TIMETABLE_LOADERS = Object.freeze({
  [SCHEDULE_MODE_SECTION]: fetchSectionTimetable,
  [SCHEDULE_MODE_TEACHER]: fetchTeacherTimetable,
  [SCHEDULE_MODE_ROOM]: fetchRoomTimetable,
})
const CHOOSE_TEXT_BY_MODE = Object.freeze({
  [SCHEDULE_MODE_TEACHER]: CHOOSE_TEACHER_TEXT,
  [SCHEDULE_MODE_ROOM]: CHOOSE_ROOM_TEXT,
})

const schoolYears = ref([])
const teachers = ref([])
const rooms = ref([])
const sections = ref([])
const isOptionsLoading = ref(true)
const areOptionsLoaded = ref(false)
const isSchoolYearFilterReady = ref(false)
const filters = ref(createScheduleFilters())
const scheduleRows = ref([])
const timetableEntries = ref([])
const isListLoading = ref(false)
const editingRow = ref(null)
const deletingRow = ref(null)
const isDeleting = ref(false)
let listRequestId = 0
let sectionsRequestId = 0

const toast = useToast()
const schoolYearStore = useSchoolYearStore()

const selectedSchoolYear = computed(
  () => schoolYears.value.find((schoolYear) => schoolYear.id === toRecordId(filters.value.schoolYearId)) ?? null,
)
const selectedSection = computed(
  () => sections.value.find((section) => section.id === toRecordId(filters.value.sectionId)) ?? null,
)
const selectedTeacher = computed(
  () => teachers.value.find((teacher) => teacher.id === toRecordId(filters.value.teacherId)) ?? null,
)
const selectedRoom = computed(() => rooms.value.find((room) => room.id === toRecordId(filters.value.roomId)) ?? null)
const isSectionMode = computed(() => filters.value.mode === SCHEDULE_MODE_SECTION)
const termOptions = computed(() => getTermNumberOptions(selectedSchoolYear.value?.term_type))
const isTermVisible = computed(() => isScheduleTermVisible(filters.value, selectedSection.value))
const timetableRequest = computed(() => buildTimetableRequest(filters.value, selectedSection.value))
const isEditOpen = computed(() => editingRow.value !== null)
const isDeleteConfirmOpen = computed(() => deletingRow.value !== null)
const deleteMessage = computed(() => buildClassDeleteMessage(deletingRow.value))
const panelId = computed(() => `${MODE_ID_PREFIX}-panel-${filters.value.mode}`)
const tabId = computed(() => `${MODE_ID_PREFIX}-tab-${filters.value.mode}`)
const targetLabel = computed(() => {
  if (filters.value.mode === SCHEDULE_MODE_TEACHER) return selectedTeacher.value?.name ?? ''
  if (filters.value.mode === SCHEDULE_MODE_ROOM) return buildRoomOptionLabel(selectedRoom.value)
  return buildSectionOptionLabel(selectedSection.value)
})
const choosePromptText = computed(() => {
  if (!isOptionsLoading.value && !areOptionsLoaded.value) return OPTIONS_FAILED_TEXT
  if (areOptionsLoaded.value && schoolYears.value.length === 0) return NO_SCHOOL_YEAR_TEXT
  if (timetableRequest.value !== null) return ''
  if (!isSectionMode.value) return CHOOSE_TEXT_BY_MODE[filters.value.mode]
  return selectedSection.value === null ? CHOOSE_SECTION_TEXT : CHOOSE_TERM_TEXT
})
const listEmptyText = computed(() => choosePromptText.value || EMPTY_SUBJECTS_TEXT)
const gridEmptyText = computed(() => choosePromptText.value || NO_MEETINGS_TEXT)

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadOptions() {
  try {
    const [schoolYearResponse, teacherResponse, roomResponse] = await Promise.all([
      fetchSchoolYears(),
      fetchActiveTeachers(),
      fetchActiveRooms(),
    ])
    schoolYears.value = schoolYearResponse?.school_years ?? []
    teachers.value = teacherResponse?.teachers ?? []
    rooms.value = roomResponse?.rooms ?? []
    areOptionsLoaded.value = true
  } catch (error) {
    toastRequestError(error, OPTIONS_FAILED_MESSAGE)
  } finally {
    isOptionsLoading.value = false
  }
}

async function loadSections() {
  const requestId = ++sectionsRequestId
  sections.value = []
  const schoolYearId = toRecordId(filters.value.schoolYearId)
  if (schoolYearId === null) return
  try {
    const sectionResponse = await fetchAllSections({ school_year_id: schoolYearId })
    if (requestId !== sectionsRequestId) return
    sections.value = sectionResponse?.sections ?? []
  } catch (error) {
    if (requestId !== sectionsRequestId) return
    toastRequestError(error, SECTIONS_FAILED_MESSAGE)
  }
}

function applyTimetableResponse(mode, timetableResponse) {
  if (mode === SCHEDULE_MODE_SECTION) {
    scheduleRows.value = listScheduleRows(timetableResponse)
    timetableEntries.value = buildSectionTimetableEntries(scheduleRows.value)
    return
  }
  scheduleRows.value = []
  const buildEntries = mode === SCHEDULE_MODE_TEACHER ? buildTeacherTimetableEntries : buildRoomTimetableEntries
  timetableEntries.value = buildEntries(timetableResponse?.meetings)
}

async function loadTimetable() {
  const requestId = ++listRequestId
  const request = timetableRequest.value
  if (request === null) {
    scheduleRows.value = []
    timetableEntries.value = []
    isListLoading.value = false
    return
  }
  isListLoading.value = true
  try {
    const timetableResponse = await TIMETABLE_LOADERS[request.mode](request.recordId, request.params)
    if (requestId !== listRequestId) return
    applyTimetableResponse(request.mode, timetableResponse)
  } catch (error) {
    if (requestId !== listRequestId) return
    toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === listRequestId) isListLoading.value = false
  }
}

function initSchoolYearFilter() {
  // MainTopBar mounts first and starts the active-year load, so "not loading" means the store holds the answer
  if (isSchoolYearFilterReady.value || !areOptionsLoaded.value || schoolYearStore.isActiveSchoolYearLoading) return
  const defaultSchoolYearId = pickDefaultSchoolYearId(schoolYears.value, schoolYearStore.activeSchoolYear)
  filters.value = applyScheduleSchoolYearChange(filters.value, defaultSchoolYearId)
  isSchoolYearFilterReady.value = true
  loadSections()
  loadTimetable()
}

function changeMode(nextMode) {
  filters.value = applyScheduleModeChange(filters.value, nextMode)
  loadTimetable()
}

function changeSchoolYear(nextSchoolYearId) {
  filters.value = applyScheduleSchoolYearChange(filters.value, nextSchoolYearId)
  loadSections()
  loadTimetable()
}

function changeSection(nextSectionId) {
  filters.value = applyScheduleSectionChange(filters.value, nextSectionId)
  loadTimetable()
}

function changeTeacher(nextTeacherId) {
  filters.value = applyScheduleTeacherChange(filters.value, nextTeacherId)
  loadTimetable()
}

function changeRoom(nextRoomId) {
  filters.value = applyScheduleRoomChange(filters.value, nextRoomId)
  loadTimetable()
}

function changeTerm(nextTermNumber) {
  filters.value = applyScheduleTermChange(filters.value, nextTermNumber)
  loadTimetable()
}

function openClassModal(scheduleRow) {
  editingRow.value = scheduleRow
}

function closeClassModal() {
  editingRow.value = null
}

function handleSaved() {
  editingRow.value = null
  loadTimetable()
}

function requestDelete(scheduleRow) {
  deletingRow.value = scheduleRow
}

function cancelDelete() {
  if (isDeleting.value) return
  deletingRow.value = null
}

async function confirmDelete() {
  if (isDeleting.value || !deletingRow.value) return
  isDeleting.value = true
  try {
    await deleteClass(deletingRow.value.class.id)
    toast.success(DELETE_SUCCESS_MESSAGE)
  } catch (error) {
    toastRequestError(error, DELETE_FAILED_MESSAGE)
  } finally {
    isDeleting.value = false
    deletingRow.value = null
    loadTimetable()
  }
}

watch([areOptionsLoaded, () => schoolYearStore.isActiveSchoolYearLoading], initSchoolYearFilter)
onMounted(loadOptions)
</script>

<template>
  <section class="rounded-lg border border-line bg-surface">
    <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line px-4 py-3">
      <h2 class="text-sm font-bold text-ink">Class schedules</h2>
      <span v-if="targetLabel" class="text-sm text-ink-muted">{{ targetLabel }}</span>
    </div>
    <TabList :tabs="SCHEDULE_MODE_TABS" :model-value="filters.mode" :id-prefix="MODE_ID_PREFIX" @update:model-value="changeMode" />
    <ScheduleFilterBar
      :mode="filters.mode"
      :school-year-id="filters.schoolYearId"
      :section-id="filters.sectionId"
      :teacher-id="filters.teacherId"
      :room-id="filters.roomId"
      :term-number="filters.termNumber"
      :school-years="schoolYears"
      :sections="sections"
      :teachers="teachers"
      :rooms="rooms"
      :term-options="termOptions"
      :is-term-visible="isTermVisible"
      :is-term-required="isSectionMode"
      :is-disabled="!areOptionsLoaded"
      @update:school-year-id="changeSchoolYear"
      @update:section-id="changeSection"
      @update:teacher-id="changeTeacher"
      @update:room-id="changeRoom"
      @update:term-number="changeTerm"
    />
    <div :id="panelId" role="tabpanel" :aria-labelledby="tabId">
      <ClassScheduleList
        v-if="isSectionMode"
        :rows="scheduleRows"
        :is-loading="isListLoading || isOptionsLoading"
        :empty-text="listEmptyText"
        :is-disabled="isDeleting"
        @schedule="openClassModal"
        @edit="openClassModal"
        @remove="requestDelete"
      />
      <h3 class="border-t border-line px-4 py-3 text-sm font-bold text-ink">Week</h3>
      <TimetableGrid
        :entries="timetableEntries"
        :is-loading="isListLoading || isOptionsLoading"
        :empty-text="gridEmptyText"
      />
    </div>
  </section>

  <ClassFormModalView
    :is-open="isEditOpen"
    :section="selectedSection"
    :schedule-row="editingRow"
    :active-teachers="teachers"
    :active-rooms="rooms"
    @close="closeClassModal"
    @saved="handleSaved"
  />

  <ConfirmDialog
    :is-open="isDeleteConfirmOpen"
    :title="DELETE_TITLE"
    :message="deleteMessage"
    :confirm-label="DELETE_CONFIRM_LABEL"
    is-destructive
    :is-loading="isDeleting"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
</template>
