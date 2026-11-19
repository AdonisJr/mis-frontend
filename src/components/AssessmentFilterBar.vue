<script setup>
import { computed } from 'vue'
import { listBillableGradeLevels } from '@/utils/feeScheduleForm.js'
import { TEXT_MAX_LENGTH } from '@/utils/studentForm.js'

const SCHOOL_YEAR_FILTER_LABEL = 'School year'
const NO_SCHOOL_YEARS_LABEL = 'No school years'
const SEARCH_LABEL = 'Search'
const SEARCH_PLACEHOLDER = 'Student name or LRN'
const GRADE_LEVEL_FILTER_LABEL = 'Grade level'
const ALL_GRADE_LEVELS_LABEL = 'All grade levels'
const PLAN_FILTER_LABEL = 'Plan'
const ALL_PLANS_LABEL = 'All plans'
const INACTIVE_SUFFIX = ' (inactive)'
const SCHOOL_YEAR_FILTER_ID = 'assessment-school-year-filter'
const SEARCH_INPUT_ID = 'assessment-search'
const GRADE_LEVEL_FILTER_ID = 'assessment-grade-level-filter'
const PLAN_FILTER_ID = 'assessment-plan-filter'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

const props = defineProps({
  schoolYearId: { type: String, required: true },
  search: { type: String, required: true },
  gradeLevelId: { type: String, required: true },
  paymentPlanId: { type: String, required: true },
  schoolYears: { type: Array, required: true },
  gradeLevels: { type: Array, required: true },
  paymentPlans: { type: Array, required: true },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:schoolYearId', 'update:search', 'update:gradeLevelId', 'update:paymentPlanId'])

const billableGradeLevels = computed(() => listBillableGradeLevels(props.gradeLevels))

function buildPlanLabel(paymentPlan) {
  return paymentPlan.is_active === true ? paymentPlan.name : `${paymentPlan.name}${INACTIVE_SUFFIX}`
}
</script>

<template>
  <div class="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:flex-wrap sm:items-end">
    <div class="sm:w-40">
      <label :for="SCHOOL_YEAR_FILTER_ID" class="mb-1 block text-sm font-semibold text-ink">
        {{ SCHOOL_YEAR_FILTER_LABEL }}
      </label>
      <select
        :id="SCHOOL_YEAR_FILTER_ID"
        :value="schoolYearId"
        :class="INPUT_CLASS"
        :disabled="isDisabled || schoolYears.length === 0"
        @change="emit('update:schoolYearId', $event.target.value)"
      >
        <option v-if="schoolYears.length === 0" value="">{{ NO_SCHOOL_YEARS_LABEL }}</option>
        <option v-for="schoolYear in schoolYears" :key="schoolYear.id" :value="String(schoolYear.id)">
          {{ schoolYear.name }}
        </option>
      </select>
    </div>
    <div class="sm:min-w-48 sm:flex-1">
      <label :for="SEARCH_INPUT_ID" class="mb-1 block text-sm font-semibold text-ink">{{ SEARCH_LABEL }}</label>
      <input
        :id="SEARCH_INPUT_ID"
        type="search"
        :value="search"
        :placeholder="SEARCH_PLACEHOLDER"
        :maxlength="TEXT_MAX_LENGTH"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        @input="emit('update:search', $event.target.value)"
      />
    </div>
    <div class="sm:w-44">
      <label :for="GRADE_LEVEL_FILTER_ID" class="mb-1 block text-sm font-semibold text-ink">
        {{ GRADE_LEVEL_FILTER_LABEL }}
      </label>
      <select
        :id="GRADE_LEVEL_FILTER_ID"
        :value="gradeLevelId"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        @change="emit('update:gradeLevelId', $event.target.value)"
      >
        <option value="">{{ ALL_GRADE_LEVELS_LABEL }}</option>
        <option v-for="gradeLevel in billableGradeLevels" :key="gradeLevel.id" :value="String(gradeLevel.id)">
          {{ gradeLevel.name }}
        </option>
      </select>
    </div>
    <div class="sm:w-52">
      <label :for="PLAN_FILTER_ID" class="mb-1 block text-sm font-semibold text-ink">{{ PLAN_FILTER_LABEL }}</label>
      <select
        :id="PLAN_FILTER_ID"
        :value="paymentPlanId"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        @change="emit('update:paymentPlanId', $event.target.value)"
      >
        <option value="">{{ ALL_PLANS_LABEL }}</option>
        <option v-for="paymentPlan in paymentPlans" :key="paymentPlan.id" :value="String(paymentPlan.id)">
          {{ buildPlanLabel(paymentPlan) }}
        </option>
      </select>
    </div>
  </div>
</template>
