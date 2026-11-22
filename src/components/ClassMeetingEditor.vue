<script setup>
import { computed } from 'vue'
import { Plus, Trash2 } from '@lucide/vue'
import { SCHOOL_DAY_OPTIONS } from '@/utils/scheduleDisplay.js'
import {
  MEETING_STEP_MINUTES,
  SCHOOL_DAY_END,
  SCHOOL_DAY_START,
  appendMeeting,
  getMeetingErrors,
  removeMeetingAt,
} from '@/utils/scheduleForm.js'
import { buildRoomOptionLabel } from '@/utils/roomDisplay.js'

const DAY_PLACEHOLDER = 'Day…'
const EMPTY_TEXT = 'No meetings yet.'
const SECONDS_PER_MINUTE = 60
const TIME_STEP_SECONDS = MEETING_STEP_MINUTES * SECONDS_PER_MINUTE
const MEETINGS_ERROR_ID = 'class-meetings-error'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const CONFLICT_CLASS = 'mt-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700'

const props = defineProps({
  modelValue: { type: Array, required: true },
  roomOptions: { type: Array, required: true },
  defaultRoomId: { type: String, default: '' },
  roomPlaceholder: { type: String, required: true },
  fieldErrors: { type: Object, default: () => ({}) },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const meetingErrors = computed(() => props.modelValue.map((_meeting, meetingIndex) => getMeetingErrors(props.fieldErrors, meetingIndex)))
const listError = computed(() => props.fieldErrors.meetings?.[0] ?? '')

function changeMeeting(meetingIndex, meetingChanges) {
  emit(
    'update:modelValue',
    props.modelValue.map((meeting, index) => (index === meetingIndex ? { ...meeting, ...meetingChanges } : meeting)),
  )
}

function addMeeting() {
  emit('update:modelValue', appendMeeting(props.modelValue, props.defaultRoomId))
}

function removeMeeting(meetingIndex) {
  emit('update:modelValue', removeMeetingAt(props.modelValue, meetingIndex))
}

function getFieldId(meetingIndex, fieldKey) {
  return `class-meeting-${meetingIndex}-${fieldKey}`
}

function getErrorId(meetingIndex, fieldKey) {
  return `${getFieldId(meetingIndex, fieldKey)}-error`
}

function getDescribedBy(meetingIndex, fieldKey) {
  if (!meetingErrors.value[meetingIndex][fieldKey]) return undefined
  return getErrorId(meetingIndex, fieldKey)
}
</script>

<template>
  <fieldset class="space-y-3">
    <legend class="mb-1 text-sm font-semibold text-ink">Meetings</legend>
    <p v-if="listError" :id="MEETINGS_ERROR_ID" class="text-xs text-red-700">{{ listError }}</p>
    <p v-if="modelValue.length === 0" class="text-sm text-ink-muted">{{ EMPTY_TEXT }}</p>
    <div v-for="(meeting, meetingIndex) in modelValue" :key="meetingIndex">
      <div class="flex flex-wrap items-start gap-2">
        <div class="w-36">
          <select
            :id="getFieldId(meetingIndex, 'day')"
            :value="meeting.day"
            :class="INPUT_CLASS"
            :disabled="isDisabled"
            :aria-label="`Day of meeting ${meetingIndex + 1}`"
            :aria-invalid="Boolean(meetingErrors[meetingIndex].day)"
            :aria-describedby="getDescribedBy(meetingIndex, 'day')"
            @change="changeMeeting(meetingIndex, { day: $event.target.value })"
          >
            <option value="" disabled>{{ DAY_PLACEHOLDER }}</option>
            <option v-for="dayOption in SCHOOL_DAY_OPTIONS" :key="dayOption.value" :value="dayOption.value">
              {{ dayOption.label }}
            </option>
          </select>
          <p v-if="meetingErrors[meetingIndex].day" :id="getErrorId(meetingIndex, 'day')" class="mt-1 text-xs text-red-700">
            {{ meetingErrors[meetingIndex].day }}
          </p>
        </div>
        <div class="w-32">
          <input
            :id="getFieldId(meetingIndex, 'start_time')"
            type="time"
            :step="TIME_STEP_SECONDS"
            :min="SCHOOL_DAY_START"
            :max="SCHOOL_DAY_END"
            :value="meeting.start_time"
            :class="INPUT_CLASS"
            class="tabular-nums"
            :disabled="isDisabled"
            :aria-label="`Start of meeting ${meetingIndex + 1}`"
            :aria-invalid="Boolean(meetingErrors[meetingIndex].start_time)"
            :aria-describedby="getDescribedBy(meetingIndex, 'start_time')"
            @input="changeMeeting(meetingIndex, { start_time: $event.target.value })"
          />
          <p
            v-if="meetingErrors[meetingIndex].start_time"
            :id="getErrorId(meetingIndex, 'start_time')"
            class="mt-1 text-xs text-red-700"
          >
            {{ meetingErrors[meetingIndex].start_time }}
          </p>
        </div>
        <div class="w-32">
          <input
            :id="getFieldId(meetingIndex, 'end_time')"
            type="time"
            :step="TIME_STEP_SECONDS"
            :min="SCHOOL_DAY_START"
            :max="SCHOOL_DAY_END"
            :value="meeting.end_time"
            :class="INPUT_CLASS"
            class="tabular-nums"
            :disabled="isDisabled"
            :aria-label="`End of meeting ${meetingIndex + 1}`"
            :aria-invalid="Boolean(meetingErrors[meetingIndex].end_time)"
            :aria-describedby="getDescribedBy(meetingIndex, 'end_time')"
            @input="changeMeeting(meetingIndex, { end_time: $event.target.value })"
          />
          <p
            v-if="meetingErrors[meetingIndex].end_time"
            :id="getErrorId(meetingIndex, 'end_time')"
            class="mt-1 text-xs text-red-700"
          >
            {{ meetingErrors[meetingIndex].end_time }}
          </p>
        </div>
        <div class="min-w-40 flex-1">
          <select
            :id="getFieldId(meetingIndex, 'room_id')"
            :value="meeting.room_id"
            :class="INPUT_CLASS"
            :disabled="isDisabled"
            :aria-label="`Room of meeting ${meetingIndex + 1}`"
            :aria-invalid="Boolean(meetingErrors[meetingIndex].room_id)"
            :aria-describedby="getDescribedBy(meetingIndex, 'room_id')"
            @change="changeMeeting(meetingIndex, { room_id: $event.target.value })"
          >
            <option value="">{{ roomPlaceholder }}</option>
            <option v-for="room in roomOptions" :key="room.id" :value="String(room.id)">
              {{ buildRoomOptionLabel(room) }}
            </option>
          </select>
          <p
            v-if="meetingErrors[meetingIndex].room_id"
            :id="getErrorId(meetingIndex, 'room_id')"
            class="mt-1 text-xs text-red-700"
          >
            {{ meetingErrors[meetingIndex].room_id }}
          </p>
        </div>
        <button
          type="button"
          :class="SECONDARY_BUTTON_CLASS"
          class="text-red-700"
          :disabled="isDisabled"
          :aria-label="`Remove meeting ${meetingIndex + 1}`"
          @click="removeMeeting(meetingIndex)"
        >
          <Trash2 :size="16" aria-hidden="true" />
        </button>
      </div>
      <p v-if="meetingErrors[meetingIndex].meeting" role="alert" :class="CONFLICT_CLASS">
        {{ meetingErrors[meetingIndex].meeting }}
      </p>
    </div>
    <button type="button" :class="SECONDARY_BUTTON_CLASS" class="text-ink" :disabled="isDisabled" @click="addMeeting">
      <Plus :size="16" aria-hidden="true" />
      Add meeting
    </button>
  </fieldset>
</template>
