<script setup>
import { ROOM_TYPE_OPTIONS } from '@/utils/roomDisplay.js'
import {
  ROOM_BUILDING_MAX_LENGTH,
  ROOM_CAPACITY_MAX,
  ROOM_CAPACITY_MIN,
  ROOM_FIELD_LABELS,
  ROOM_NAME_MAX_LENGTH,
} from '@/utils/roomForm.js'

const NAME_FIELD = 'name'
const BUILDING_FIELD = 'building'
const CAPACITY_FIELD = 'capacity'
const TYPE_FIELD = 'type'
const FIELD_ID_PREFIX = 'room-'
const OPTIONAL_SUFFIX = ' (optional)'
const SELECT_PLACEHOLDER = 'Select…'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

const props = defineProps({
  modelValue: { type: Object, required: true },
  fieldErrors: { type: Object, default: () => ({}) },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

function updateField(fieldKey, fieldValue) {
  emit('update:modelValue', { ...props.modelValue, [fieldKey]: fieldValue })
}

function getFieldError(fieldKey) {
  return props.fieldErrors[fieldKey]?.[0] ?? ''
}

function getFieldId(fieldKey) {
  return FIELD_ID_PREFIX + fieldKey
}

function getErrorId(fieldKey) {
  return `${getFieldId(fieldKey)}-error`
}

function getDescribedBy(fieldKey) {
  if (!getFieldError(fieldKey)) return undefined
  return getErrorId(fieldKey)
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <label :for="getFieldId(NAME_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ ROOM_FIELD_LABELS.name }}
      </label>
      <input
        :id="getFieldId(NAME_FIELD)"
        type="text"
        autocomplete="off"
        :maxlength="ROOM_NAME_MAX_LENGTH"
        :value="modelValue[NAME_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError(NAME_FIELD))"
        :aria-describedby="getDescribedBy(NAME_FIELD)"
        @input="updateField(NAME_FIELD, $event.target.value)"
      />
      <p v-if="getFieldError(NAME_FIELD)" :id="getErrorId(NAME_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(NAME_FIELD) }}
      </p>
    </div>

    <div>
      <label :for="getFieldId(BUILDING_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ ROOM_FIELD_LABELS.building + OPTIONAL_SUFFIX }}
      </label>
      <input
        :id="getFieldId(BUILDING_FIELD)"
        type="text"
        autocomplete="off"
        :maxlength="ROOM_BUILDING_MAX_LENGTH"
        :value="modelValue[BUILDING_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError(BUILDING_FIELD))"
        :aria-describedby="getDescribedBy(BUILDING_FIELD)"
        @input="updateField(BUILDING_FIELD, $event.target.value)"
      />
      <p v-if="getFieldError(BUILDING_FIELD)" :id="getErrorId(BUILDING_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(BUILDING_FIELD) }}
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label :for="getFieldId(CAPACITY_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
          {{ ROOM_FIELD_LABELS.capacity + OPTIONAL_SUFFIX }}
        </label>
        <input
          :id="getFieldId(CAPACITY_FIELD)"
          type="number"
          inputmode="numeric"
          step="1"
          :min="ROOM_CAPACITY_MIN"
          :max="ROOM_CAPACITY_MAX"
          :value="modelValue[CAPACITY_FIELD]"
          :class="INPUT_CLASS"
          class="tabular-nums"
          :disabled="isDisabled"
          :aria-invalid="Boolean(getFieldError(CAPACITY_FIELD))"
          :aria-describedby="getDescribedBy(CAPACITY_FIELD)"
          @input="updateField(CAPACITY_FIELD, $event.target.value)"
        />
        <p v-if="getFieldError(CAPACITY_FIELD)" :id="getErrorId(CAPACITY_FIELD)" class="mt-1 text-xs text-red-700">
          {{ getFieldError(CAPACITY_FIELD) }}
        </p>
      </div>
      <div>
        <label :for="getFieldId(TYPE_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
          {{ ROOM_FIELD_LABELS.type }}
        </label>
        <select
          :id="getFieldId(TYPE_FIELD)"
          :value="modelValue[TYPE_FIELD]"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          :aria-invalid="Boolean(getFieldError(TYPE_FIELD))"
          :aria-describedby="getDescribedBy(TYPE_FIELD)"
          @change="updateField(TYPE_FIELD, $event.target.value)"
        >
          <option value="" disabled>{{ SELECT_PLACEHOLDER }}</option>
          <option v-for="typeOption in ROOM_TYPE_OPTIONS" :key="typeOption.value" :value="typeOption.value">
            {{ typeOption.label }}
          </option>
        </select>
        <p v-if="getFieldError(TYPE_FIELD)" :id="getErrorId(TYPE_FIELD)" class="mt-1 text-xs text-red-700">
          {{ getFieldError(TYPE_FIELD) }}
        </p>
      </div>
    </div>
  </div>
</template>
