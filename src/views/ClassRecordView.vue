<script setup>
import { computed, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { LockOpen, Plus, Printer, Save, Send } from '@lucide/vue'
import BlankScoreList from '@/components/BlankScoreList.vue'
import ClassRecordHeader from '@/components/ClassRecordHeader.vue'
import QuarterHistoryList from '@/components/QuarterHistoryList.vue'
import QuarterStatusBanner from '@/components/QuarterStatusBanner.vue'
import ScoreGrid from '@/components/ScoreGrid.vue'
import ConfirmDialog from '@/components/modal/ConfirmDialog.vue'
import ClassRecordActivityModalView from '@/views/ClassRecordActivityModalView.vue'
import ClassRecordReopenModalView from '@/views/ClassRecordReopenModalView.vue'
import { fetchClassRoster } from '@/services/classListService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { deleteActivity, fetchClassRecord, saveScores, submitQuarter } from '@/services/gradingService.js'
import { MY_CLASSES_ROUTE_NAME } from '@/routeNames.js'
import { useAuthStore } from '@/stores/authStore.js'
import { buildClassHeaderItems, buildSubjectText } from '@/utils/classListDisplay.js'
import { buildClassListQuery, readClassListQuery } from '@/utils/classListSearch.js'
import { buildClassRecordPermissions } from '@/utils/classRecordAccess.js'
import {
  buildEmptyComponentText,
  buildGradeRows,
  buildHistoryRows,
  buildLeftRows,
  buildStatusInfo,
  GRADE_COLUMNS,
  groupActivityColumns,
} from '@/utils/classRecordDisplay.js'
import { buildClassRecordPrintHeaderItems, CLASS_RECORD_PRINT_PAGE_CLASS } from '@/utils/gradingPrint.js'
import {
  buildClassRecordQuery,
  buildQuarterOptions,
  listClassQuarters,
  pickQuarter,
  TRIMESTER_TEXT,
} from '@/utils/gradingQuarters.js'
import {
  buildCellErrors,
  buildCellKey,
  buildScoreDraft,
  listBlankScoreLines,
  listChangedScores,
} from '@/utils/scoreGrid.js'
import { toIdText, toRecordId } from '@/utils/sectionForm.js'

const HTTP_NOT_FOUND = 404
const HTTP_UNPROCESSABLE_ENTITY = 422
const VALID_QUARTERS = ['1', '2', '3', '4']
const PAGE_TITLE = 'Class record'
const TITLE_SEPARATOR = ' · '
const BACK_LABEL = 'Back to my classes'
const LOADING_TEXT = 'Loading…'
const NOT_FOUND_TEXT = 'This class does not exist.'
const FORBIDDEN_TEXT = 'You cannot open this class record.'
const UNSAVED_TEXT = 'Save or discard your score changes first.'
const NO_CHANGES_TEXT = 'No score changes to save.'
const INVALID_SCORES_TEXT = 'Fix the highlighted scores first.'
const LEAVE_CONFIRM_TEXT = 'Leave without saving your score changes?'
const SUBMIT_MESSAGE = 'Activities and scores lock until an admin or registrar reopens the quarter.'
const LOAD_FAILED_MESSAGE = 'Could not load the class record.'
const SAVE_FAILED_MESSAGE = 'Could not save the scores.'
const SUBMIT_FAILED_MESSAGE = 'Could not submit the quarter.'
const DELETE_FAILED_MESSAGE = 'Could not delete the activity.'
const SCORE_ERROR_KEY = /^scores\.(?<rowIndex>\d+)\.score$/
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const BACK_LINK_CLASS =
  'text-sm font-semibold text-accent hover:underline focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const classRecord = ref(null)
const quarter = ref('')
const scoreDraft = ref(null)
const serverCellErrors = ref({})
const isLoading = ref(false)
const isNotFound = ref(false)
const isForbidden = ref(false)
const isTrimester = ref(false)
const recordErrorText = ref('')
const isSavingScores = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const isSubmitOpen = ref(false)
const isActivityOpen = ref(false)
const isReopenOpen = ref(false)
const editingActivity = ref(null)
const deletingActivity = ref(null)
const headerKey = ref(0)
let recordRequestId = 0
let isQuarterFromQuery = false

const classId = computed(() => toRecordId(route.params.classId))
const quarterNumber = computed(() => Number(quarter.value))
const permissions = computed(() => buildClassRecordPermissions(classRecord.value, authStore.user))
const activities = computed(() => classRecord.value?.activities ?? [])
const changedScores = computed(() => (scoreDraft.value ? listChangedScores(classRecord.value, scoreDraft.value) : []))
const hasUnsavedChanges = computed(() => changedScores.value.length > 0)
const cellErrors = computed(() => ({
  ...(scoreDraft.value ? buildCellErrors(classRecord.value, scoreDraft.value) : {}),
  ...serverCellErrors.value,
}))
const columnGroups = computed(() => groupActivityColumns(activities.value, classRecord.value?.weights))
const gradeRows = computed(() => buildGradeRows(classRecord.value, scoreDraft.value))
const leftRows = computed(() => buildLeftRows(classRecord.value))
const statusInfo = computed(() => buildStatusInfo(classRecord.value))
const historyRows = computed(() => buildHistoryRows(classRecord.value?.history))
const emptyComponentText = computed(() => buildEmptyComponentText(classRecord.value?.components_without_activities))
const headerItems = computed(() => buildClassHeaderItems(classRecord.value?.class))
const printHeaderItems = computed(() => buildClassRecordPrintHeaderItems(classRecord.value, quarter.value))
const quarterOptions = computed(() => buildQuarterOptions(classRecord.value?.quarters))
const sheetTitle = computed(
  () => `${PAGE_TITLE}${TITLE_SEPARATOR}${buildSubjectText(classRecord.value?.class?.subject)}`,
)
const blankLines = computed(() => listBlankScoreLines(classRecord.value, scoreDraft.value))
const submitTitle = computed(() => `Submit Quarter ${quarter.value}?`)
const deleteMessage = computed(() => `Delete ${deletingActivity.value?.title}? Its scores are deleted too.`)
const blockedText = computed(() => {
  if (isNotFound.value) return NOT_FOUND_TEXT
  if (isForbidden.value) return FORBIDDEN_TEXT
  if (isTrimester.value) return TRIMESTER_TEXT
  return recordErrorText.value
})
const backQuery = computed(() => buildClassListQuery(readClassListQuery(route.query)))

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

function resetRecord() {
  classRecord.value = null
  scoreDraft.value = null
  serverCellErrors.value = {}
  quarter.value = ''
  recordErrorText.value = ''
  isNotFound.value = false
  isForbidden.value = false
  isTrimester.value = false
}

function applyLoadedRecord(loadedRecord) {
  classRecord.value = loadedRecord
  serverCellErrors.value = {}
  scoreDraft.value = permissions.value.canEdit ? buildScoreDraft(loadedRecord) : null
}

function readLoadError(error) {
  const status = error.response?.status
  if (status === HTTP_NOT_FOUND) isNotFound.value = true
  if (status === HTTP_FORBIDDEN) isForbidden.value = true
  if (status === HTTP_UNPROCESSABLE_ENTITY) recordErrorText.value = error.response?.data?.message ?? LOAD_FAILED_MESSAGE
  if (!isNotFound.value) toastRequestError(error, LOAD_FAILED_MESSAGE)
}

async function loadClassRecord() {
  const requestId = ++recordRequestId
  isLoading.value = true
  try {
    const recordResponse = await fetchClassRecord({ classId: classId.value, quarter: quarterNumber.value })
    if (requestId !== recordRequestId) return
    isQuarterFromQuery = false
    applyLoadedRecord(recordResponse?.class_record ?? null)
  } catch (error) {
    if (requestId !== recordRequestId) return
    if (error.response?.status === HTTP_UNPROCESSABLE_ENTITY && isQuarterFromQuery) return await bootstrapFromRoster()
    readLoadError(error)
  } finally {
    if (requestId === recordRequestId) isLoading.value = false
  }
}

async function bootstrapFromRoster() {
  isQuarterFromQuery = false
  const requestId = ++recordRequestId
  isLoading.value = true
  try {
    const rosterResponse = await fetchClassRoster(classId.value)
    if (requestId !== recordRequestId) return
    const quarterNumbers = listClassQuarters(rosterResponse?.class)
    isTrimester.value = quarterNumbers.length === 0
    quarter.value = pickQuarter(quarterNumbers, toIdText(route.query.quarter))
  } catch (error) {
    if (requestId !== recordRequestId) return
    readLoadError(error)
    return
  } finally {
    if (requestId === recordRequestId) isLoading.value = false
  }
  if (quarter.value !== '') await loadClassRecord()
}

async function loadClassHeader() {
  recordRequestId += 1
  resetRecord()
  if (classId.value === null) {
    isNotFound.value = true
    return
  }
  const queryQuarter = toIdText(route.query.quarter)
  isQuarterFromQuery = VALID_QUARTERS.includes(queryQuarter)
  if (!isQuarterFromQuery) return await bootstrapFromRoster()
  quarter.value = queryQuarter
  await loadClassRecord()
}

function refuseWhenUnsaved() {
  if (!hasUnsavedChanges.value) return false
  toast.info(UNSAVED_TEXT)
  return true
}

function changeQuarter(nextQuarter) {
  if (refuseWhenUnsaved()) {
    headerKey.value += 1
    return
  }
  quarter.value = nextQuarter
  router.replace({ query: buildClassRecordQuery(readClassListQuery(route.query), nextQuarter) })
  loadClassRecord()
}

function clearServerCellError(cellKey) {
  if (!Object.hasOwn(serverCellErrors.value, cellKey)) return
  const remainingErrors = { ...serverCellErrors.value }
  delete remainingErrors[cellKey]
  serverCellErrors.value = remainingErrors
}

function updateScore(scoreChange) {
  scoreDraft.value = { ...scoreDraft.value, [scoreChange.cellKey]: scoreChange.scoreText }
  clearServerCellError(scoreChange.cellKey)
}

function discardScoreChanges() {
  scoreDraft.value = buildScoreDraft(classRecord.value)
  serverCellErrors.value = {}
}

function mapServerScoreErrors(validationErrors, sentScores) {
  const mappedErrors = {}
  for (const [errorKey, errorMessages] of Object.entries(validationErrors ?? {})) {
    const sentScore = sentScores[Number(SCORE_ERROR_KEY.exec(errorKey)?.groups.rowIndex)]
    if (sentScore) mappedErrors[buildCellKey(sentScore.student_id, sentScore.activity_id)] = errorMessages[0]
  }
  return mappedErrors
}

function applySaveError(error, sentScores) {
  const validationErrors = error.response?.data?.errors
  if (error.response?.status === HTTP_UNPROCESSABLE_ENTITY && validationErrors) {
    serverCellErrors.value = mapServerScoreErrors(validationErrors, sentScores)
  }
  toastRequestError(error, SAVE_FAILED_MESSAGE)
}

async function saveClassScores() {
  if (isSavingScores.value) return
  if (!hasUnsavedChanges.value) {
    toast.info(NO_CHANGES_TEXT)
    return
  }
  if (Object.keys(buildCellErrors(classRecord.value, scoreDraft.value)).length > 0) {
    toast.error(INVALID_SCORES_TEXT)
    return
  }
  const sentScores = changedScores.value
  isSavingScores.value = true
  try {
    await saveScores({ classId: classId.value, quarter: quarterNumber.value }, { scores: sentScores })
    toast.success('Scores saved.')
    await loadClassRecord()
  } catch (error) {
    applySaveError(error, sentScores)
  } finally {
    isSavingScores.value = false
  }
}

function openAddActivity() {
  if (refuseWhenUnsaved()) return
  editingActivity.value = null
  isActivityOpen.value = true
}

function openEditActivity(activity) {
  if (refuseWhenUnsaved()) return
  editingActivity.value = activity
  isActivityOpen.value = true
}

function finishActivitySave() {
  isActivityOpen.value = false
  loadClassRecord()
}

function requestDelete(activity) {
  if (refuseWhenUnsaved()) return
  deletingActivity.value = activity
}

async function confirmDelete() {
  if (isDeleting.value) return
  isDeleting.value = true
  try {
    await deleteActivity({ classId: classId.value, quarter: quarterNumber.value, activityId: deletingActivity.value.id })
    toast.success('Activity deleted.')
    deletingActivity.value = null
    await loadClassRecord()
  } catch (error) {
    toastRequestError(error, DELETE_FAILED_MESSAGE)
  } finally {
    isDeleting.value = false
  }
}

function requestSubmit() {
  if (refuseWhenUnsaved()) return
  isSubmitOpen.value = true
}

async function confirmSubmit() {
  if (isSubmitting.value) return
  isSubmitting.value = true
  try {
    await submitQuarter({ classId: classId.value, quarter: quarterNumber.value })
    toast.success('Quarter submitted.')
    isSubmitOpen.value = false
    await loadClassRecord()
  } catch (error) {
    toastRequestError(error, SUBMIT_FAILED_MESSAGE)
  } finally {
    isSubmitting.value = false
  }
}

function finishReopen() {
  isReopenOpen.value = false
  loadClassRecord()
}

function printClassRecord() {
  window.print()
}

onBeforeRouteLeave(() => {
  if (!hasUnsavedChanges.value) return true
  return window.confirm(LEAVE_CONFIRM_TEXT)
})

watch(classId, loadClassHeader, { immediate: true })
</script>

<template>
  <p v-if="isLoading && !classRecord" class="text-sm text-ink-muted">{{ LOADING_TEXT }}</p>

  <section
    v-if="isNotFound || isForbidden || isTrimester || recordErrorText"
    class="rounded-lg border border-line bg-surface px-4 py-12 text-center"
  >
    <p class="text-sm font-bold text-ink">{{ blockedText }}</p>
    <RouterLink :to="{ name: MY_CLASSES_ROUTE_NAME, query: backQuery }" :class="[BACK_LINK_CLASS, 'mt-2 inline-block']">
      {{ BACK_LABEL }}
    </RouterLink>
  </section>

  <template v-if="classRecord">
    <div class="flex flex-wrap items-center justify-between gap-3 print:hidden">
      <RouterLink :to="{ name: MY_CLASSES_ROUTE_NAME, query: backQuery }" :class="BACK_LINK_CLASS">
        {{ BACK_LABEL }}
      </RouterLink>
      <div class="flex flex-wrap items-center gap-2">
        <button v-if="permissions.canEdit" type="button" :class="SECONDARY_BUTTON_CLASS" @click="openAddActivity">
          <Plus :size="16" aria-hidden="true" />
          Add activity
        </button>
        <button v-if="hasUnsavedChanges" type="button" :class="SECONDARY_BUTTON_CLASS" @click="discardScoreChanges">
          Discard
        </button>
        <button
          v-if="permissions.canEdit"
          type="button"
          :class="PRIMARY_BUTTON_CLASS"
          :disabled="isSavingScores"
          @click="saveClassScores"
        >
          <Save :size="16" aria-hidden="true" />
          {{ isSavingScores ? 'Saving…' : 'Save' }}
        </button>
        <button v-if="permissions.canSubmit" type="button" :class="SECONDARY_BUTTON_CLASS" @click="requestSubmit">
          <Send :size="16" aria-hidden="true" />
          Submit
        </button>
        <button v-if="permissions.canReopen" type="button" :class="SECONDARY_BUTTON_CLASS" @click="isReopenOpen = true">
          <LockOpen :size="16" aria-hidden="true" />
          Reopen
        </button>
        <button type="button" :class="SECONDARY_BUTTON_CLASS" @click="printClassRecord">
          <Printer :size="16" aria-hidden="true" />
          Print
        </button>
      </div>
    </div>

    <section
      :class="[CLASS_RECORD_PRINT_PAGE_CLASS, 'rounded-lg border border-line bg-surface p-4 print:border-0 print:p-0']"
      :aria-busy="isLoading"
    >
      <ClassRecordHeader
        :key="headerKey"
        :title="sheetTitle"
        :items="headerItems"
        :print-items="printHeaderItems"
        :quarter-options="quarterOptions"
        :quarter="quarter"
        :is-quarter-disabled="isLoading"
        @update:quarter="changeQuarter"
      />
      <QuarterStatusBanner :status-info="statusInfo" :empty-component-text="emptyComponentText" />
      <ScoreGrid
        :column-groups="columnGroups"
        :grade-columns="GRADE_COLUMNS"
        :grade-rows="gradeRows"
        :left-rows="leftRows"
        :score-draft="scoreDraft"
        :cell-errors="cellErrors"
        :can-edit="permissions.canEdit"
        @update:score="updateScore"
        @edit-activity="openEditActivity"
        @delete-activity="requestDelete"
      />
    </section>

    <QuarterHistoryList :rows="historyRows" />

    <ClassRecordActivityModalView
      :is-open="isActivityOpen"
      :class-id="classId"
      :quarter="quarterNumber"
      :activities="activities"
      :activity="editingActivity"
      @close="isActivityOpen = false"
      @saved="finishActivitySave"
    />
    <ClassRecordReopenModalView
      :is-open="isReopenOpen"
      :class-id="classId"
      :quarter="quarterNumber"
      @close="isReopenOpen = false"
      @reopened="finishReopen"
    />
    <ConfirmDialog
      :is-open="isSubmitOpen"
      :title="submitTitle"
      :message="SUBMIT_MESSAGE"
      confirm-label="Submit"
      :is-loading="isSubmitting"
      @confirm="confirmSubmit"
      @cancel="isSubmitOpen = false"
    >
      <BlankScoreList :lines="blankLines" />
    </ConfirmDialog>
    <ConfirmDialog
      :is-open="deletingActivity !== null"
      title="Delete activity?"
      :message="deleteMessage"
      confirm-label="Delete"
      is-destructive
      :is-loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="deletingActivity = null"
    />
  </template>
</template>
