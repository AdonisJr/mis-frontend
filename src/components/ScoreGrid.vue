<script setup>
import { computed, ref } from 'vue'
import ScoreGridHead from '@/components/ScoreGridHead.vue'
import { PRINT_ROW_CLASS } from '@/utils/classListPrint.js'
import { buildCellKey, createCellNavigator } from '@/utils/scoreGrid.js'

const NO_SCORE_TEXT = '—'
const SHIFT_TAB_KEY = 'Shift+Tab'
const TAB_KEY = 'Tab'
const ESCAPE_KEY = 'Escape'
const BLANK_CLASS = 'bg-amber-100'
const ERROR_CLASS = 'border-red-600'
const INPUT_CLASS =
  'w-16 rounded-md border border-line bg-surface px-2 py-1 text-right text-sm tabular-nums text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 print:hidden'

const props = defineProps({
  columnGroups: { type: Array, required: true },
  gradeColumns: { type: Array, required: true },
  gradeRows: { type: Array, required: true },
  leftRows: { type: Array, default: () => [] },
  scoreDraft: { type: Object, default: null },
  cellErrors: { type: Object, default: () => ({}) },
  canEdit: { type: Boolean, default: false },
})

const emit = defineEmits(['update:score', 'edit-activity', 'delete-activity'])

const gridRoot = ref(null)

const activities = computed(() => props.columnGroups.flatMap((columnGroup) => columnGroup.activities))
const isEditable = computed(() => props.canEdit && props.scoreDraft !== null)
const columnCount = computed(() => 1 + activities.value.length + props.gradeColumns.length)
const navigateCell = computed(() => createCellNavigator(props.gradeRows.length, activities.value.length))
const leftGroupLabel = computed(() => `Left the class (${props.leftRows.length})`)

function getCellKey(gradeRow, activity) {
  return buildCellKey(gradeRow.studentId, activity.id)
}

function getDraftText(gradeRow, activity) {
  return props.scoreDraft?.[getCellKey(gradeRow, activity)] ?? ''
}

function isBlankCell(gradeRow, activity) {
  if (isEditable.value) return getDraftText(gradeRow, activity).trim() === ''
  return String(gradeRow.scoreByActivityId[activity.id] ?? '') === ''
}

function getCellError(gradeRow, activity) {
  return props.cellErrors[getCellKey(gradeRow, activity)] ?? ''
}

function getCellClass(gradeRow, activity) {
  return ['border-l border-line px-2 py-1.5 text-center tabular-nums', isBlankCell(gradeRow, activity) ? BLANK_CLASS : '']
}

function getInputClass(gradeRow, activity) {
  return [INPUT_CLASS, getCellError(gradeRow, activity) ? ERROR_CLASS : '', isBlankCell(gradeRow, activity) ? BLANK_CLASS : '']
}

function getReadOnlyText(gradeRow, activity) {
  const scoreText = String(gradeRow.scoreByActivityId[activity.id] ?? '')
  return scoreText === '' ? NO_SCORE_TEXT : scoreText
}

function focusCell(cellPosition) {
  const selector = `[data-row="${cellPosition.rowIndex}"][data-column="${cellPosition.columnIndex}"]`
  gridRoot.value?.querySelector(selector)?.focus()
}

function revertCell(gradeRow, activity) {
  const serverText = String(gradeRow.scoreByActivityId[activity.id] ?? '')
  emit('update:score', { cellKey: getCellKey(gradeRow, activity), scoreText: serverText })
}

function readKeyName(keyboardEvent) {
  if (keyboardEvent.key === TAB_KEY && keyboardEvent.shiftKey) return SHIFT_TAB_KEY
  return keyboardEvent.key
}

function moveFocus(keyboardEvent, cellPosition) {
  const nextPosition = navigateCell.value(cellPosition, readKeyName(keyboardEvent))
  if (nextPosition === null) return
  keyboardEvent.preventDefault()
  focusCell(nextPosition)
}

function onCellKeydown(keyboardEvent, cellPosition) {
  if (keyboardEvent.key !== ESCAPE_KEY) return moveFocus(keyboardEvent, cellPosition)
  const gradeRow = props.gradeRows[cellPosition.rowIndex]
  revertCell(gradeRow, activities.value[cellPosition.columnIndex])
}
</script>

<template>
  <div ref="gridRoot" class="overflow-x-auto">
    <table class="w-full text-left text-sm">
      <ScoreGridHead
        :column-groups="columnGroups"
        :grade-columns="gradeColumns"
        :can-edit="isEditable"
        @edit-activity="emit('edit-activity', $event)"
        @delete-activity="emit('delete-activity', $event)"
      />
      <tbody>
        <tr v-if="gradeRows.length === 0">
          <td :colspan="columnCount" class="border-t border-line px-4 py-8 text-center text-ink-muted">
            No students in this class yet.
          </td>
        </tr>
        <tr v-for="(gradeRow, rowIndex) in gradeRows" :key="gradeRow.key" :class="['border-t border-line', PRINT_ROW_CLASS]">
          <th scope="row" class="sticky left-0 bg-surface px-3 py-1.5 text-left font-semibold text-ink">
            {{ gradeRow.name }}
          </th>
          <td v-for="(activity, columnIndex) in activities" :key="activity.id" :class="getCellClass(gradeRow, activity)">
            <template v-if="isEditable">
              <input
                type="text"
                inputmode="decimal"
                autocomplete="off"
                :value="getDraftText(gradeRow, activity)"
                :data-row="rowIndex"
                :data-column="columnIndex"
                :class="getInputClass(gradeRow, activity)"
                :aria-label="`${gradeRow.name}, ${activity.title}`"
                :aria-invalid="Boolean(getCellError(gradeRow, activity))"
                :title="getCellError(gradeRow, activity) || undefined"
                @input="emit('update:score', { cellKey: getCellKey(gradeRow, activity), scoreText: $event.target.value })"
                @keydown="onCellKeydown($event, { rowIndex, columnIndex })"
              />
              <span class="hidden print:inline">{{ getDraftText(gradeRow, activity) }}</span>
            </template>
            <template v-else>{{ getReadOnlyText(gradeRow, activity) }}</template>
          </td>
          <td
            v-for="gradeColumn in gradeColumns"
            :key="gradeColumn.key"
            class="border-l border-line px-3 py-1.5 text-right font-semibold tabular-nums text-ink"
          >
            {{ gradeRow.grades[gradeColumn.key] }}
          </td>
        </tr>
      </tbody>
      <tbody v-if="leftRows.length > 0">
        <tr>
          <th
            :colspan="columnCount"
            scope="rowgroup"
            class="border-t border-line bg-page px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-ink-muted"
          >
            {{ leftGroupLabel }}
          </th>
        </tr>
        <tr v-for="leftRow in leftRows" :key="leftRow.key" :class="['border-t border-line text-ink-muted', PRINT_ROW_CLASS]">
          <th scope="row" class="sticky left-0 bg-surface px-3 py-1.5 text-left font-semibold">{{ leftRow.name }}</th>
          <td
            v-for="activity in activities"
            :key="activity.id"
            class="border-l border-line px-2 py-1.5 text-center tabular-nums"
          >
            {{ getReadOnlyText(leftRow, activity) }}
          </td>
          <td
            v-for="gradeColumn in gradeColumns"
            :key="gradeColumn.key"
            class="border-l border-line px-3 py-1.5 text-right tabular-nums"
          >
            {{ leftRow.grades[gradeColumn.key] }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
