<script setup>
import { computed } from 'vue'
import { ArrowRightLeft, CircleCheck, LogOut, UserMinus } from '@lucide/vue'
import {
  ENROLLMENT_ACTION_COMPLETE,
  ENROLLMENT_ACTION_DROP,
  ENROLLMENT_ACTION_MOVE,
  ENROLLMENT_ACTION_TRANSFER,
  listEnrollmentActions,
} from '@/utils/enrollmentStatus.js'
import { formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  enrollment: { type: Object, required: true },
})

const emit = defineEmits(['move', 'drop', 'transfer', 'complete'])

const availableActions = computed(() => listEnrollmentActions(props.enrollment))
const studentName = computed(() => formatEnrollmentStudentName(props.enrollment.student))
</script>

<template>
  <div class="flex justify-end gap-2">
    <button
      v-if="availableActions.includes(ENROLLMENT_ACTION_MOVE)"
      type="button"
      :class="SECONDARY_BUTTON_CLASS"
      class="text-ink"
      :aria-label="`Move ${studentName}`"
      @click="emit('move')"
    >
      <ArrowRightLeft :size="16" aria-hidden="true" />
      <span class="hidden sm:inline">Move</span>
    </button>
    <button
      v-if="availableActions.includes(ENROLLMENT_ACTION_DROP)"
      type="button"
      :class="SECONDARY_BUTTON_CLASS"
      class="text-red-700"
      :aria-label="`Drop ${studentName}`"
      @click="emit('drop')"
    >
      <UserMinus :size="16" aria-hidden="true" />
      <span class="hidden sm:inline">Drop</span>
    </button>
    <button
      v-if="availableActions.includes(ENROLLMENT_ACTION_TRANSFER)"
      type="button"
      :class="SECONDARY_BUTTON_CLASS"
      class="text-ink"
      :aria-label="`Transfer ${studentName}`"
      @click="emit('transfer')"
    >
      <LogOut :size="16" aria-hidden="true" />
      <span class="hidden sm:inline">Transfer</span>
    </button>
    <button
      v-if="availableActions.includes(ENROLLMENT_ACTION_COMPLETE)"
      type="button"
      :class="SECONDARY_BUTTON_CLASS"
      class="text-ink"
      :aria-label="`Complete ${studentName}`"
      @click="emit('complete')"
    >
      <CircleCheck :size="16" aria-hidden="true" />
      <span class="hidden sm:inline">Complete</span>
    </button>
  </div>
</template>
