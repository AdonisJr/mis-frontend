<script setup>
import {
  FEE_ITEM_CATEGORY_OPTIONS,
  FEE_ITEM_DESCRIPTION_MAX_LENGTH,
  FEE_ITEM_FIELD_LABELS,
  FEE_ITEM_NAME_MAX_LENGTH,
} from '@/utils/feeItemForm.js'

const NAME_FIELD = 'name'
const CATEGORY_FIELD = 'category'
const DESCRIPTION_FIELD = 'description'
const FIELD_ID_PREFIX = 'fee-item-'
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
        {{ FEE_ITEM_FIELD_LABELS.name }}
      </label>
      <input
        :id="getFieldId(NAME_FIELD)"
        type="text"
        autocomplete="off"
        :maxlength="FEE_ITEM_NAME_MAX_LENGTH"
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
      <label :for="getFieldId(CATEGORY_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ FEE_ITEM_FIELD_LABELS.category }}
      </label>
      <select
        :id="getFieldId(CATEGORY_FIELD)"
        :value="modelValue[CATEGORY_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError(CATEGORY_FIELD))"
        :aria-describedby="getDescribedBy(CATEGORY_FIELD)"
        @change="updateField(CATEGORY_FIELD, $event.target.value)"
      >
        <option value="" disabled>{{ SELECT_PLACEHOLDER }}</option>
        <option v-for="categoryOption in FEE_ITEM_CATEGORY_OPTIONS" :key="categoryOption.value" :value="categoryOption.value">
          {{ categoryOption.label }}
        </option>
      </select>
      <p v-if="getFieldError(CATEGORY_FIELD)" :id="getErrorId(CATEGORY_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(CATEGORY_FIELD) }}
      </p>
    </div>

    <div>
      <label :for="getFieldId(DESCRIPTION_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ FEE_ITEM_FIELD_LABELS.description + OPTIONAL_SUFFIX }}
      </label>
      <textarea
        :id="getFieldId(DESCRIPTION_FIELD)"
        rows="3"
        :maxlength="FEE_ITEM_DESCRIPTION_MAX_LENGTH"
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
