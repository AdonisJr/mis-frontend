<script setup>
import { TEXT_MAX_LENGTH } from '@/utils/studentForm.js'

const SEARCH_LABEL = 'Search'
const SEARCH_PLACEHOLDER = 'LRN or name'
const LEVEL_FILTER_LABEL = 'Level'
const ALL_LEVELS_LABEL = 'All levels'
const SEARCH_INPUT_ID = 'student-search'
const LEVEL_FILTER_ID = 'student-level-filter'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

defineProps({
  search: { type: String, required: true },
  gradeLevelId: { type: String, required: true },
  gradeLevels: { type: Array, required: true },
})

const emit = defineEmits(['update:search', 'update:gradeLevelId'])
</script>

<template>
  <div class="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-end">
    <div class="sm:flex-1">
      <label :for="SEARCH_INPUT_ID" class="mb-1 block text-sm font-semibold text-ink">{{ SEARCH_LABEL }}</label>
      <input
        :id="SEARCH_INPUT_ID"
        type="search"
        :value="search"
        :placeholder="SEARCH_PLACEHOLDER"
        :maxlength="TEXT_MAX_LENGTH"
        :class="INPUT_CLASS"
        @input="emit('update:search', $event.target.value)"
      />
    </div>
    <div class="sm:w-56">
      <label :for="LEVEL_FILTER_ID" class="mb-1 block text-sm font-semibold text-ink">{{ LEVEL_FILTER_LABEL }}</label>
      <select
        :id="LEVEL_FILTER_ID"
        :value="gradeLevelId"
        :class="INPUT_CLASS"
        @change="emit('update:gradeLevelId', $event.target.value)"
      >
        <option value="">{{ ALL_LEVELS_LABEL }}</option>
        <option v-for="gradeLevel in gradeLevels" :key="gradeLevel.id" :value="String(gradeLevel.id)">
          {{ gradeLevel.name }}
        </option>
      </select>
    </div>
  </div>
</template>
