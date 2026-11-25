<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { NotebookPen, Printer } from '@lucide/vue'
import ClassListHeader from '@/components/ClassListHeader.vue'
import RosterTable from '@/components/RosterTable.vue'
import { fetchClassRoster } from '@/services/classListService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { CLASS_RECORD_ROUTE_NAME, MY_CLASSES_ROUTE_NAME } from '@/routeNames.js'
import { buildClassHeaderItems, buildScheduleSummaryLines, buildSubjectText } from '@/utils/classListDisplay.js'
import { buildClassPrintHeaderItems } from '@/utils/classListPrint.js'
import { buildRosterColumns, buildRosterGroups, hasGuardianFields } from '@/utils/rosterDisplay.js'
import { toRecordId } from '@/utils/sectionForm.js'

const HTTP_NOT_FOUND = 404
const PAGE_TITLE = 'Class list'
const TITLE_SEPARATOR = ' · '
const BACK_LABEL = 'Back to my classes'
const CLASS_RECORD_LABEL = 'Class record'
const LOADING_TEXT = 'Loading…'
const NOT_FOUND_TEXT = 'This class does not exist.'
const FORBIDDEN_TEXT = 'You cannot open this class list.'
const EMPTY_ROSTER_TEXT = 'No students in this class yet.'
const LOAD_FAILED_MESSAGE = 'Could not load the class list.'
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1'
const BACK_LINK_CLASS =
  'text-sm font-semibold text-accent hover:underline focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1'

const route = useRoute()
const toast = useToast()

const rosterClass = ref(null)
const rosterGroups = ref({ listedRows: [], leftRows: [] })
const isRosterLoading = ref(false)
const isNotFound = ref(false)
const isForbidden = ref(false)
let rosterRequestId = 0

const classId = computed(() => toRecordId(route.params.classId))
const headerItems = computed(() => buildClassHeaderItems(rosterClass.value))
const printHeaderItems = computed(() => buildClassPrintHeaderItems(rosterClass.value))
const scheduleLines = computed(() => buildScheduleSummaryLines(rosterClass.value?.meetings))
const rosterColumns = computed(() => buildRosterColumns(hasGuardianFields(rosterGroups.value)))
const sheetTitle = computed(() => `${PAGE_TITLE}${TITLE_SEPARATOR}${buildSubjectText(rosterClass.value?.subject)}`)

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

function resetRoster() {
  rosterClass.value = null
  rosterGroups.value = { listedRows: [], leftRows: [] }
  isNotFound.value = false
  isForbidden.value = false
}

function applyRosterError(error) {
  const status = error.response?.status
  isNotFound.value = status === HTTP_NOT_FOUND
  isForbidden.value = status === HTTP_FORBIDDEN
  if (!isNotFound.value) toastRequestError(error, LOAD_FAILED_MESSAGE)
}

async function loadRoster() {
  const requestId = ++rosterRequestId
  resetRoster()
  if (classId.value === null) {
    isNotFound.value = true
    return
  }
  isRosterLoading.value = true
  try {
    const rosterResponse = await fetchClassRoster(classId.value)
    if (requestId !== rosterRequestId) return
    rosterClass.value = rosterResponse?.class ?? null
    rosterGroups.value = buildRosterGroups(rosterResponse)
  } catch (error) {
    if (requestId !== rosterRequestId) return
    applyRosterError(error)
  } finally {
    if (requestId === rosterRequestId) isRosterLoading.value = false
  }
}

function printClassList() {
  window.print()
}

watch(classId, loadRoster, { immediate: true })
</script>

<template>
  <p v-if="isRosterLoading" class="text-sm text-ink-muted">{{ LOADING_TEXT }}</p>

  <section
    v-if="isNotFound || isForbidden"
    class="rounded-lg border border-line bg-surface px-4 py-12 text-center"
  >
    <p class="text-sm font-bold text-ink">{{ isNotFound ? NOT_FOUND_TEXT : FORBIDDEN_TEXT }}</p>
    <RouterLink :to="{ name: MY_CLASSES_ROUTE_NAME, query: route.query }" :class="[BACK_LINK_CLASS, 'mt-2 inline-block']">
      {{ BACK_LABEL }}
    </RouterLink>
  </section>

  <template v-if="rosterClass">
    <div class="flex flex-wrap items-center justify-between gap-3 print:hidden">
      <RouterLink :to="{ name: MY_CLASSES_ROUTE_NAME, query: route.query }" :class="BACK_LINK_CLASS">
        {{ BACK_LABEL }}
      </RouterLink>
      <div class="flex items-center gap-2">
        <RouterLink
          :to="{ name: CLASS_RECORD_ROUTE_NAME, params: { classId }, query: route.query }"
          :class="SECONDARY_BUTTON_CLASS"
        >
          <NotebookPen :size="16" aria-hidden="true" />
          {{ CLASS_RECORD_LABEL }}
        </RouterLink>
        <button type="button" :class="SECONDARY_BUTTON_CLASS" @click="printClassList">
          <Printer :size="16" aria-hidden="true" />
          Print
        </button>
      </div>
    </div>

    <section class="print-page-statement rounded-lg border border-line bg-surface p-4 print:border-0 print:p-0">
      <ClassListHeader
        :title="sheetTitle"
        :items="headerItems"
        :print-items="printHeaderItems"
        :schedule-lines="scheduleLines"
      />
      <RosterTable :roster-groups="rosterGroups" :columns="rosterColumns" :empty-text="EMPTY_ROSTER_TEXT" />
    </section>
  </template>
</template>
