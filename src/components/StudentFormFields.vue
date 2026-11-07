<script setup>
import {
  CONTACT_MAX_LENGTH,
  LRN_LENGTH,
  OPTIONAL_STUDENT_FIELDS,
  STUDENT_FIELD_LABELS,
  STUDENT_GENDER_OPTIONS,
  STUDENT_GRADE_LEVELS,
  TEXT_MAX_LENGTH,
} from '@/utils/studentForm.js'

const LRN_FIELD = 'lrn'
const FIRST_NAME_FIELD = 'first_name'
const MIDDLE_NAME_FIELD = 'middle_name'
const LAST_NAME_FIELD = 'last_name'
const BIRTH_DATE_FIELD = 'birth_date'
const GENDER_FIELD = 'gender'
const GRADE_LEVEL_FIELD = 'grade_level'
const SECTION_FIELD = 'section'
const ADDRESS_FIELD = 'address'
const CONTACT_FIELD = 'contact'
const GUARDIAN_NAME_FIELD = 'guardian_name'
const GUARDIAN_RELATIONSHIP_FIELD = 'guardian_relationship'
const GUARDIAN_CONTACT_FIELD = 'guardian_contact'
const FIELD_ID_PREFIX = 'student-'
const OPTIONAL_SUFFIX = ' (optional)'
const SECTION_HINT = 'e.g. BSIT'
const SECTION_HINT_ID = 'student-section-hint'
const SELECT_PLACEHOLDER = 'Select…'
const STUDENT_GROUP_TITLE = 'Student'
const LEVEL_GROUP_TITLE = 'Level'
const CONTACT_GROUP_TITLE = 'Contact'
const GUARDIAN_GROUP_TITLE = 'Guardian'
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

function getSectionDescribedBy() {
  if (!getFieldError(SECTION_FIELD)) return SECTION_HINT_ID
  return `${SECTION_HINT_ID} ${getErrorId(SECTION_FIELD)}`
}

function getFieldLabel(fieldKey) {
  const fieldLabel = STUDENT_FIELD_LABELS[fieldKey]
  if (!OPTIONAL_STUDENT_FIELDS.includes(fieldKey)) return fieldLabel
  return fieldLabel + OPTIONAL_SUFFIX
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-3">
      <h3 class="text-xs font-bold uppercase tracking-wider text-ink-muted">{{ STUDENT_GROUP_TITLE }}</h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label :for="getFieldId(LRN_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
            {{ getFieldLabel(LRN_FIELD) }}
          </label>
          <input
            :id="getFieldId(LRN_FIELD)"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            :maxlength="LRN_LENGTH"
            :value="modelValue[LRN_FIELD]"
            :class="INPUT_CLASS"
            :disabled="isDisabled"
            :aria-invalid="Boolean(getFieldError(LRN_FIELD))"
            :aria-describedby="getDescribedBy(LRN_FIELD)"
            @input="updateField(LRN_FIELD, $event.target.value)"
          />
          <p v-if="getFieldError(LRN_FIELD)" :id="getErrorId(LRN_FIELD)" class="mt-1 text-xs text-red-700">
            {{ getFieldError(LRN_FIELD) }}
          </p>
        </div>
        <div>
          <label :for="getFieldId(FIRST_NAME_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
            {{ getFieldLabel(FIRST_NAME_FIELD) }}
          </label>
          <input
            :id="getFieldId(FIRST_NAME_FIELD)"
            type="text"
            :maxlength="TEXT_MAX_LENGTH"
            :value="modelValue[FIRST_NAME_FIELD]"
            :class="INPUT_CLASS"
            :disabled="isDisabled"
            :aria-invalid="Boolean(getFieldError(FIRST_NAME_FIELD))"
            :aria-describedby="getDescribedBy(FIRST_NAME_FIELD)"
            @input="updateField(FIRST_NAME_FIELD, $event.target.value)"
          />
          <p v-if="getFieldError(FIRST_NAME_FIELD)" :id="getErrorId(FIRST_NAME_FIELD)" class="mt-1 text-xs text-red-700">
            {{ getFieldError(FIRST_NAME_FIELD) }}
          </p>
        </div>
        <div>
          <label :for="getFieldId(MIDDLE_NAME_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
            {{ getFieldLabel(MIDDLE_NAME_FIELD) }}
          </label>
          <input
            :id="getFieldId(MIDDLE_NAME_FIELD)"
            type="text"
            :maxlength="TEXT_MAX_LENGTH"
            :value="modelValue[MIDDLE_NAME_FIELD]"
            :class="INPUT_CLASS"
            :disabled="isDisabled"
            :aria-invalid="Boolean(getFieldError(MIDDLE_NAME_FIELD))"
            :aria-describedby="getDescribedBy(MIDDLE_NAME_FIELD)"
            @input="updateField(MIDDLE_NAME_FIELD, $event.target.value)"
          />
          <p v-if="getFieldError(MIDDLE_NAME_FIELD)" :id="getErrorId(MIDDLE_NAME_FIELD)" class="mt-1 text-xs text-red-700">
            {{ getFieldError(MIDDLE_NAME_FIELD) }}
          </p>
        </div>
        <div>
          <label :for="getFieldId(LAST_NAME_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
            {{ getFieldLabel(LAST_NAME_FIELD) }}
          </label>
          <input
            :id="getFieldId(LAST_NAME_FIELD)"
            type="text"
            :maxlength="TEXT_MAX_LENGTH"
            :value="modelValue[LAST_NAME_FIELD]"
            :class="INPUT_CLASS"
            :disabled="isDisabled"
            :aria-invalid="Boolean(getFieldError(LAST_NAME_FIELD))"
            :aria-describedby="getDescribedBy(LAST_NAME_FIELD)"
            @input="updateField(LAST_NAME_FIELD, $event.target.value)"
          />
          <p v-if="getFieldError(LAST_NAME_FIELD)" :id="getErrorId(LAST_NAME_FIELD)" class="mt-1 text-xs text-red-700">
            {{ getFieldError(LAST_NAME_FIELD) }}
          </p>
        </div>
        <div>
          <label :for="getFieldId(BIRTH_DATE_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
            {{ getFieldLabel(BIRTH_DATE_FIELD) }}
          </label>
          <input
            :id="getFieldId(BIRTH_DATE_FIELD)"
            type="date"
            :value="modelValue[BIRTH_DATE_FIELD]"
            :class="INPUT_CLASS"
            :disabled="isDisabled"
            :aria-invalid="Boolean(getFieldError(BIRTH_DATE_FIELD))"
            :aria-describedby="getDescribedBy(BIRTH_DATE_FIELD)"
            @input="updateField(BIRTH_DATE_FIELD, $event.target.value)"
          />
          <p v-if="getFieldError(BIRTH_DATE_FIELD)" :id="getErrorId(BIRTH_DATE_FIELD)" class="mt-1 text-xs text-red-700">
            {{ getFieldError(BIRTH_DATE_FIELD) }}
          </p>
        </div>
        <div>
          <label :for="getFieldId(GENDER_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
            {{ getFieldLabel(GENDER_FIELD) }}
          </label>
          <select
            :id="getFieldId(GENDER_FIELD)"
            :value="modelValue[GENDER_FIELD]"
            :class="INPUT_CLASS"
            :disabled="isDisabled"
            :aria-invalid="Boolean(getFieldError(GENDER_FIELD))"
            :aria-describedby="getDescribedBy(GENDER_FIELD)"
            @change="updateField(GENDER_FIELD, $event.target.value)"
          >
            <option value="" disabled>{{ SELECT_PLACEHOLDER }}</option>
            <option v-for="genderOption in STUDENT_GENDER_OPTIONS" :key="genderOption.value" :value="genderOption.value">
              {{ genderOption.label }}
            </option>
          </select>
          <p v-if="getFieldError(GENDER_FIELD)" :id="getErrorId(GENDER_FIELD)" class="mt-1 text-xs text-red-700">
            {{ getFieldError(GENDER_FIELD) }}
          </p>
        </div>
      </div>
    </div>

    <div class="space-y-3">
      <h3 class="text-xs font-bold uppercase tracking-wider text-ink-muted">{{ LEVEL_GROUP_TITLE }}</h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label :for="getFieldId(GRADE_LEVEL_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
            {{ getFieldLabel(GRADE_LEVEL_FIELD) }}
          </label>
          <select
            :id="getFieldId(GRADE_LEVEL_FIELD)"
            :value="modelValue[GRADE_LEVEL_FIELD]"
            :class="INPUT_CLASS"
            :disabled="isDisabled"
            :aria-invalid="Boolean(getFieldError(GRADE_LEVEL_FIELD))"
            :aria-describedby="getDescribedBy(GRADE_LEVEL_FIELD)"
            @change="updateField(GRADE_LEVEL_FIELD, $event.target.value)"
          >
            <option value="" disabled>{{ SELECT_PLACEHOLDER }}</option>
            <option v-for="gradeLevelOption in STUDENT_GRADE_LEVELS" :key="gradeLevelOption" :value="gradeLevelOption">
              {{ gradeLevelOption }}
            </option>
          </select>
          <p v-if="getFieldError(GRADE_LEVEL_FIELD)" :id="getErrorId(GRADE_LEVEL_FIELD)" class="mt-1 text-xs text-red-700">
            {{ getFieldError(GRADE_LEVEL_FIELD) }}
          </p>
        </div>
        <div>
          <label :for="getFieldId(SECTION_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
            {{ getFieldLabel(SECTION_FIELD) }}
          </label>
          <input
            :id="getFieldId(SECTION_FIELD)"
            type="text"
            :maxlength="TEXT_MAX_LENGTH"
            :value="modelValue[SECTION_FIELD]"
            :class="INPUT_CLASS"
            :disabled="isDisabled"
            :aria-invalid="Boolean(getFieldError(SECTION_FIELD))"
            :aria-describedby="getSectionDescribedBy()"
            @input="updateField(SECTION_FIELD, $event.target.value)"
          />
          <p :id="SECTION_HINT_ID" class="mt-1 text-xs text-ink-muted">{{ SECTION_HINT }}</p>
          <p v-if="getFieldError(SECTION_FIELD)" :id="getErrorId(SECTION_FIELD)" class="mt-1 text-xs text-red-700">
            {{ getFieldError(SECTION_FIELD) }}
          </p>
        </div>
      </div>
    </div>

    <div class="space-y-3">
      <h3 class="text-xs font-bold uppercase tracking-wider text-ink-muted">{{ CONTACT_GROUP_TITLE }}</h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label :for="getFieldId(ADDRESS_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
            {{ getFieldLabel(ADDRESS_FIELD) }}
          </label>
          <input
            :id="getFieldId(ADDRESS_FIELD)"
            type="text"
            :maxlength="TEXT_MAX_LENGTH"
            :value="modelValue[ADDRESS_FIELD]"
            :class="INPUT_CLASS"
            :disabled="isDisabled"
            :aria-invalid="Boolean(getFieldError(ADDRESS_FIELD))"
            :aria-describedby="getDescribedBy(ADDRESS_FIELD)"
            @input="updateField(ADDRESS_FIELD, $event.target.value)"
          />
          <p v-if="getFieldError(ADDRESS_FIELD)" :id="getErrorId(ADDRESS_FIELD)" class="mt-1 text-xs text-red-700">
            {{ getFieldError(ADDRESS_FIELD) }}
          </p>
        </div>
        <div>
          <label :for="getFieldId(CONTACT_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
            {{ getFieldLabel(CONTACT_FIELD) }}
          </label>
          <input
            :id="getFieldId(CONTACT_FIELD)"
            type="tel"
            :maxlength="CONTACT_MAX_LENGTH"
            :value="modelValue[CONTACT_FIELD]"
            :class="INPUT_CLASS"
            :disabled="isDisabled"
            :aria-invalid="Boolean(getFieldError(CONTACT_FIELD))"
            :aria-describedby="getDescribedBy(CONTACT_FIELD)"
            @input="updateField(CONTACT_FIELD, $event.target.value)"
          />
          <p v-if="getFieldError(CONTACT_FIELD)" :id="getErrorId(CONTACT_FIELD)" class="mt-1 text-xs text-red-700">
            {{ getFieldError(CONTACT_FIELD) }}
          </p>
        </div>
      </div>
    </div>

    <div class="space-y-3">
      <h3 class="text-xs font-bold uppercase tracking-wider text-ink-muted">{{ GUARDIAN_GROUP_TITLE }}</h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label :for="getFieldId(GUARDIAN_NAME_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
            {{ getFieldLabel(GUARDIAN_NAME_FIELD) }}
          </label>
          <input
            :id="getFieldId(GUARDIAN_NAME_FIELD)"
            type="text"
            :maxlength="TEXT_MAX_LENGTH"
            :value="modelValue[GUARDIAN_NAME_FIELD]"
            :class="INPUT_CLASS"
            :disabled="isDisabled"
            :aria-invalid="Boolean(getFieldError(GUARDIAN_NAME_FIELD))"
            :aria-describedby="getDescribedBy(GUARDIAN_NAME_FIELD)"
            @input="updateField(GUARDIAN_NAME_FIELD, $event.target.value)"
          />
          <p v-if="getFieldError(GUARDIAN_NAME_FIELD)" :id="getErrorId(GUARDIAN_NAME_FIELD)" class="mt-1 text-xs text-red-700">
            {{ getFieldError(GUARDIAN_NAME_FIELD) }}
          </p>
        </div>
        <div>
          <label :for="getFieldId(GUARDIAN_RELATIONSHIP_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
            {{ getFieldLabel(GUARDIAN_RELATIONSHIP_FIELD) }}
          </label>
          <input
            :id="getFieldId(GUARDIAN_RELATIONSHIP_FIELD)"
            type="text"
            :maxlength="TEXT_MAX_LENGTH"
            :value="modelValue[GUARDIAN_RELATIONSHIP_FIELD]"
            :class="INPUT_CLASS"
            :disabled="isDisabled"
            :aria-invalid="Boolean(getFieldError(GUARDIAN_RELATIONSHIP_FIELD))"
            :aria-describedby="getDescribedBy(GUARDIAN_RELATIONSHIP_FIELD)"
            @input="updateField(GUARDIAN_RELATIONSHIP_FIELD, $event.target.value)"
          />
          <p
            v-if="getFieldError(GUARDIAN_RELATIONSHIP_FIELD)"
            :id="getErrorId(GUARDIAN_RELATIONSHIP_FIELD)"
            class="mt-1 text-xs text-red-700"
          >
            {{ getFieldError(GUARDIAN_RELATIONSHIP_FIELD) }}
          </p>
        </div>
        <div>
          <label :for="getFieldId(GUARDIAN_CONTACT_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
            {{ getFieldLabel(GUARDIAN_CONTACT_FIELD) }}
          </label>
          <input
            :id="getFieldId(GUARDIAN_CONTACT_FIELD)"
            type="tel"
            :maxlength="CONTACT_MAX_LENGTH"
            :value="modelValue[GUARDIAN_CONTACT_FIELD]"
            :class="INPUT_CLASS"
            :disabled="isDisabled"
            :aria-invalid="Boolean(getFieldError(GUARDIAN_CONTACT_FIELD))"
            :aria-describedby="getDescribedBy(GUARDIAN_CONTACT_FIELD)"
            @input="updateField(GUARDIAN_CONTACT_FIELD, $event.target.value)"
          />
          <p
            v-if="getFieldError(GUARDIAN_CONTACT_FIELD)"
            :id="getErrorId(GUARDIAN_CONTACT_FIELD)"
            class="mt-1 text-xs text-red-700"
          >
            {{ getFieldError(GUARDIAN_CONTACT_FIELD) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
