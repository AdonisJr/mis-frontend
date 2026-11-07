<script setup>
const NAME_FIELD = 'name'
const START_DATE_FIELD = 'start_date'
const END_DATE_FIELD = 'end_date'
const DESCRIPTION_FIELD = 'description'
const FIELD_ID_PREFIX = 'school-year-'
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
      <label :for="getFieldId(NAME_FIELD)" class="mb-1 block text-sm font-semibold text-ink">Name</label>
      <input
        :id="getFieldId(NAME_FIELD)"
        type="text"
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
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label :for="getFieldId(START_DATE_FIELD)" class="mb-1 block text-sm font-semibold text-ink">Start date</label>
        <input
          :id="getFieldId(START_DATE_FIELD)"
          type="date"
          :value="modelValue[START_DATE_FIELD]"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          :aria-invalid="Boolean(getFieldError(START_DATE_FIELD))"
          :aria-describedby="getDescribedBy(START_DATE_FIELD)"
          @input="updateField(START_DATE_FIELD, $event.target.value)"
        />
        <p v-if="getFieldError(START_DATE_FIELD)" :id="getErrorId(START_DATE_FIELD)" class="mt-1 text-xs text-red-700">
          {{ getFieldError(START_DATE_FIELD) }}
        </p>
      </div>
      <div>
        <label :for="getFieldId(END_DATE_FIELD)" class="mb-1 block text-sm font-semibold text-ink">End date</label>
        <input
          :id="getFieldId(END_DATE_FIELD)"
          type="date"
          :value="modelValue[END_DATE_FIELD]"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          :aria-invalid="Boolean(getFieldError(END_DATE_FIELD))"
          :aria-describedby="getDescribedBy(END_DATE_FIELD)"
          @input="updateField(END_DATE_FIELD, $event.target.value)"
        />
        <p v-if="getFieldError(END_DATE_FIELD)" :id="getErrorId(END_DATE_FIELD)" class="mt-1 text-xs text-red-700">
          {{ getFieldError(END_DATE_FIELD) }}
        </p>
      </div>
    </div>
    <div>
      <label :for="getFieldId(DESCRIPTION_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        Description (optional)
      </label>
      <textarea
        :id="getFieldId(DESCRIPTION_FIELD)"
        rows="3"
        :value="modelValue[DESCRIPTION_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError(DESCRIPTION_FIELD))"
        :aria-describedby="getDescribedBy(DESCRIPTION_FIELD)"
        @input="updateField(DESCRIPTION_FIELD, $event.target.value)"
      />
      <p v-if="getFieldError(DESCRIPTION_FIELD)" :id="getErrorId(DESCRIPTION_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(DESCRIPTION_FIELD) }}
      </p>
    </div>
  </div>
</template>
