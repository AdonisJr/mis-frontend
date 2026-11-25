<script setup>
import { ACCOUNT_TYPE_OPTIONS, listSubtypeOptions } from '@/utils/accountDisplay.js'
import {
  ACCOUNT_CODE_MAX_LENGTH,
  ACCOUNT_FIELD_LABELS,
  ACCOUNT_NAME_MAX_LENGTH,
  applyAccountFormTypeChange,
} from '@/utils/accountForm.js'
import { computed } from 'vue'

const CODE_FIELD = 'code'
const NAME_FIELD = 'name'
const TYPE_FIELD = 'type'
const SUBTYPE_FIELD = 'subtype'
const CONTRA_FIELD = 'is_contra'
const DESCRIPTION_FIELD = 'description'
const FIELD_ID_PREFIX = 'account-'
const OPTIONAL_SUFFIX = ' (optional)'
const SELECT_PLACEHOLDER = 'Select…'
const SUBTYPE_HINT = 'Choose a type first.'
const CONTRA_HELP = 'Flips the normal balance.'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

const props = defineProps({
  modelValue: { type: Object, required: true },
  fieldErrors: { type: Object, default: () => ({}) },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const subtypeOptions = computed(() => listSubtypeOptions(props.modelValue[TYPE_FIELD]))
const isSubtypeDisabled = computed(() => props.isDisabled || props.modelValue[TYPE_FIELD] === '')

function updateField(fieldKey, fieldValue) {
  emit('update:modelValue', { ...props.modelValue, [fieldKey]: fieldValue })
}

function updateType(nextType) {
  emit('update:modelValue', applyAccountFormTypeChange(props.modelValue, nextType))
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
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label :for="getFieldId(CODE_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
          {{ ACCOUNT_FIELD_LABELS.code }}
        </label>
        <input
          :id="getFieldId(CODE_FIELD)"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          :maxlength="ACCOUNT_CODE_MAX_LENGTH"
          :value="modelValue[CODE_FIELD]"
          :class="INPUT_CLASS"
          class="font-mono"
          :disabled="isDisabled"
          :aria-invalid="Boolean(getFieldError(CODE_FIELD))"
          :aria-describedby="getDescribedBy(CODE_FIELD)"
          @input="updateField(CODE_FIELD, $event.target.value)"
        />
        <p v-if="getFieldError(CODE_FIELD)" :id="getErrorId(CODE_FIELD)" class="mt-1 text-xs text-red-700">
          {{ getFieldError(CODE_FIELD) }}
        </p>
      </div>
      <div>
        <label :for="getFieldId(NAME_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
          {{ ACCOUNT_FIELD_LABELS.name }}
        </label>
        <input
          :id="getFieldId(NAME_FIELD)"
          type="text"
          autocomplete="off"
          :maxlength="ACCOUNT_NAME_MAX_LENGTH"
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
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label :for="getFieldId(TYPE_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
          {{ ACCOUNT_FIELD_LABELS.type }}
        </label>
        <select
          :id="getFieldId(TYPE_FIELD)"
          :value="modelValue[TYPE_FIELD]"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          :aria-invalid="Boolean(getFieldError(TYPE_FIELD))"
          :aria-describedby="getDescribedBy(TYPE_FIELD)"
          @change="updateType($event.target.value)"
        >
          <option value="" disabled>{{ SELECT_PLACEHOLDER }}</option>
          <option v-for="typeOption in ACCOUNT_TYPE_OPTIONS" :key="typeOption.value" :value="typeOption.value">
            {{ typeOption.label }}
          </option>
        </select>
        <p v-if="getFieldError(TYPE_FIELD)" :id="getErrorId(TYPE_FIELD)" class="mt-1 text-xs text-red-700">
          {{ getFieldError(TYPE_FIELD) }}
        </p>
      </div>
      <div>
        <label :for="getFieldId(SUBTYPE_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
          {{ ACCOUNT_FIELD_LABELS.subtype }}
        </label>
        <select
          :id="getFieldId(SUBTYPE_FIELD)"
          :value="modelValue[SUBTYPE_FIELD]"
          :class="INPUT_CLASS"
          :disabled="isSubtypeDisabled"
          :aria-invalid="Boolean(getFieldError(SUBTYPE_FIELD))"
          :aria-describedby="getDescribedBy(SUBTYPE_FIELD)"
          @change="updateField(SUBTYPE_FIELD, $event.target.value)"
        >
          <option value="" disabled>{{ SELECT_PLACEHOLDER }}</option>
          <option v-for="subtypeOption in subtypeOptions" :key="subtypeOption.value" :value="subtypeOption.value">
            {{ subtypeOption.label }}
          </option>
        </select>
        <p v-if="modelValue[TYPE_FIELD] === ''" class="mt-1 text-xs text-ink-muted">{{ SUBTYPE_HINT }}</p>
        <p v-if="getFieldError(SUBTYPE_FIELD)" :id="getErrorId(SUBTYPE_FIELD)" class="mt-1 text-xs text-red-700">
          {{ getFieldError(SUBTYPE_FIELD) }}
        </p>
      </div>
    </div>

    <div>
      <label class="flex items-center gap-2 text-sm font-semibold text-ink" :for="getFieldId(CONTRA_FIELD)">
        <input
          :id="getFieldId(CONTRA_FIELD)"
          type="checkbox"
          :checked="modelValue[CONTRA_FIELD] === true"
          :disabled="isDisabled"
          class="size-4 rounded border-line focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1"
          :aria-describedby="getFieldId(CONTRA_FIELD) + '-help'"
          @change="updateField(CONTRA_FIELD, $event.target.checked)"
        />
        {{ ACCOUNT_FIELD_LABELS.is_contra }}
      </label>
      <p :id="getFieldId(CONTRA_FIELD) + '-help'" class="mt-1 text-xs text-ink-muted">{{ CONTRA_HELP }}</p>
      <p v-if="getFieldError(CONTRA_FIELD)" class="mt-1 text-xs text-red-700">{{ getFieldError(CONTRA_FIELD) }}</p>
    </div>

    <div>
      <label :for="getFieldId(DESCRIPTION_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ ACCOUNT_FIELD_LABELS.description + OPTIONAL_SUFFIX }}
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
