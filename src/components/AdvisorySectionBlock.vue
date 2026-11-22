<script setup>
import { FileText, Printer } from '@lucide/vue'
import RosterTable from '@/components/RosterTable.vue'
import TimetableGrid from '@/components/TimetableGrid.vue'
import {
  CLASS_LIST_ROUTE_NAME,
  CLASS_RECORD_ROUTE_NAME,
  REPORT_CARD_ROUTE_NAME,
  SECTION_REPORT_CARDS_ROUTE_NAME,
} from '@/routeNames.js'

const PANEL_TITLE = 'Advisory section'
const CLASS_LISTS_TITLE = 'Class lists'
const WEEK_TITLE = 'Week'
const PRINT_ALL_REPORT_CARDS_LABEL = 'Print all report cards'
const REPORT_CARD_LABEL = 'Report card'
const CLASS_RECORD_LABEL = 'Class record'
const NO_CLASSES_TEXT = 'No classes scheduled yet.'
const EMPTY_ROSTER_TEXT = 'No students in this section yet.'
const NO_MEETINGS_TEXT = 'No meetings this week.'
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1'
const LINK_CLASS =
  'rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-accent hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1'

defineProps({
  advisoryBlock: { type: Object, required: true },
  rosterColumns: { type: Array, required: true },
  printHeaderItems: { type: Array, required: true },
  linkQuery: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['print'])
</script>

<template>
  <section class="rounded-lg border border-line bg-surface print:border-0">
    <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <h2 class="text-sm font-bold text-ink">{{ PANEL_TITLE }} · {{ advisoryBlock.sectionText }}</h2>
      <div class="flex items-center gap-2 print:hidden">
        <RouterLink
          :to="{
            name: SECTION_REPORT_CARDS_ROUTE_NAME,
            params: { sectionId: advisoryBlock.sectionId },
            query: linkQuery,
          }"
          :class="SECONDARY_BUTTON_CLASS"
        >
          <FileText :size="16" aria-hidden="true" />
          {{ PRINT_ALL_REPORT_CARDS_LABEL }}
        </RouterLink>
        <button type="button" :class="SECONDARY_BUTTON_CLASS" @click="emit('print')">
          <Printer :size="16" aria-hidden="true" />
          Print
        </button>
      </div>
    </div>
    <dl class="flex flex-wrap gap-x-6 gap-y-1 px-4 py-3 text-sm print:hidden">
      <div class="flex gap-2">
        <dt class="text-ink-muted">Adviser</dt>
        <dd class="font-semibold text-ink">{{ advisoryBlock.adviserText }}</dd>
      </div>
      <div class="flex gap-2">
        <dt class="text-ink-muted">Room</dt>
        <dd class="font-semibold text-ink">{{ advisoryBlock.roomText }}</dd>
      </div>
      <div class="flex gap-2">
        <dt class="text-ink-muted">Enrolled</dt>
        <dd class="font-semibold tabular-nums text-ink">{{ advisoryBlock.enrolledText }}</dd>
      </div>
    </dl>
    <dl class="hidden grid-cols-2 gap-x-6 gap-y-1 px-4 py-3 text-sm print:grid">
      <div v-for="printItem in printHeaderItems" :key="printItem.key" class="flex gap-2">
        <dt class="w-24 shrink-0 text-ink-muted">{{ printItem.label }}</dt>
        <dd class="min-w-0 font-semibold text-ink">{{ printItem.text }}</dd>
      </div>
    </dl>
    <RosterTable
      :roster-groups="advisoryBlock.rosterGroups"
      :columns="rosterColumns"
      :empty-text="EMPTY_ROSTER_TEXT"
    >
      <template #actions="{ row }">
        <RouterLink
          :to="{
            name: REPORT_CARD_ROUTE_NAME,
            params: { studentId: row.studentId },
            query: { school_year_id: linkQuery.school_year_id },
          }"
          :aria-label="`Open the report card of ${row.name}`"
          :class="SECONDARY_BUTTON_CLASS"
        >
          <FileText :size="16" aria-hidden="true" />
          {{ REPORT_CARD_LABEL }}
        </RouterLink>
      </template>
    </RosterTable>
  </section>

  <section class="rounded-lg border border-line bg-surface print:hidden">
    <div class="border-b border-line px-4 py-3">
      <h2 class="text-sm font-bold text-ink">{{ CLASS_LISTS_TITLE }}</h2>
    </div>
    <ul v-if="advisoryBlock.classLinks.length > 0" class="flex flex-wrap gap-2 px-4 py-3">
      <li v-for="classLink in advisoryBlock.classLinks" :key="classLink.classId" class="flex gap-1">
        <RouterLink
          :to="{ name: CLASS_LIST_ROUTE_NAME, params: { classId: classLink.classId }, query: linkQuery }"
          :class="LINK_CLASS"
        >
          {{ classLink.label }}
        </RouterLink>
        <RouterLink
          :to="{ name: CLASS_RECORD_ROUTE_NAME, params: { classId: classLink.classId }, query: linkQuery }"
          :aria-label="`Open the class record of ${classLink.label}`"
          :class="LINK_CLASS"
        >
          {{ CLASS_RECORD_LABEL }}
        </RouterLink>
      </li>
    </ul>
    <p v-else class="px-4 py-6 text-center text-sm text-ink-muted">{{ NO_CLASSES_TEXT }}</p>
  </section>

  <section class="rounded-lg border border-line bg-surface print:hidden">
    <div class="border-b border-line px-4 py-3">
      <h2 class="text-sm font-bold text-ink">{{ WEEK_TITLE }}</h2>
    </div>
    <TimetableGrid :entries="advisoryBlock.entries" :empty-text="NO_MEETINGS_TEXT" />
  </section>
</template>
