<script setup>
import EmployeePasswordFields from '@/components/EmployeePasswordFields.vue'
import { EMPLOYEE_FIELD_LABELS, EMPLOYEE_ROLE_OPTIONS, toggleRole } from '@/utils/employeeForm.js'
import { CONTACT_MAX_LENGTH, TEXT_MAX_LENGTH } from '@/utils/studentForm.js'

const NAME_FIELD = 'name'
const EMAIL_FIELD = 'email'
const CONTACT_FIELD = 'contact'
const ROLES_FIELD = 'roles'
const FIELD_ID_PREFIX = 'employee-'
const OPTIONAL_SUFFIX = ' (optional)'
const LOCKED_ROLE_HINT = 'You cannot remove your own admin role.'
const LOCKED_ROLE_HINT_ID = 'employee-locked-role-hint'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'
const CHECKBOX_CLASS =
  'size-4 rounded-sm border-line accent-accent focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  modelValue: { type: Object, required: true },
  fieldErrors: { type: Object, default: () => ({}) },
  isDisabled: { type: Boolean, default: false },
  isCreating: { type: Boolean, default: false },
  lockedRoles: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])

function updateField(fieldKey, fieldValue) {
  emit('update:modelValue', { ...props.modelValue, [fieldKey]: fieldValue })
}

function emitFormValues(nextFormValues) {
  emit('update:modelValue', nextFormValues)
}

function toggleRoleSelection(roleValue) {
  emit('update:modelValue', { ...props.modelValue, roles: toggleRole(props.modelValue.roles, roleValue) })
}

function isRoleChecked(roleValue) {
  return Array.isArray(props.modelValue.roles) && props.modelValue.roles.includes(roleValue)
}

function isRoleLocked(roleValue) {
  return props.lockedRoles.includes(roleValue)
}

function getRoleCheckboxId(roleValue) {
  return `${FIELD_ID_PREFIX}role-${roleValue}`
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

function getRolesDescribedBy() {
  const describedByIds = []
  if (props.lockedRoles.length > 0) describedByIds.push(LOCKED_ROLE_HINT_ID)
  if (getFieldError(ROLES_FIELD)) describedByIds.push(getErrorId(ROLES_FIELD))
  if (describedByIds.length === 0) return undefined
  return describedByIds.join(' ')
}
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label :for="getFieldId(NAME_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
          {{ EMPLOYEE_FIELD_LABELS.name }}
        </label>
        <input
          :id="getFieldId(NAME_FIELD)"
          type="text"
          autocomplete="off"
          :maxlength="TEXT_MAX_LENGTH"
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
        <label :for="getFieldId(EMAIL_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
          {{ EMPLOYEE_FIELD_LABELS.email }}
        </label>
        <input
          :id="getFieldId(EMAIL_FIELD)"
          type="email"
          autocomplete="off"
          :maxlength="TEXT_MAX_LENGTH"
          :value="modelValue[EMAIL_FIELD]"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          :aria-invalid="Boolean(getFieldError(EMAIL_FIELD))"
          :aria-describedby="getDescribedBy(EMAIL_FIELD)"
          @input="updateField(EMAIL_FIELD, $event.target.value)"
        />
        <p v-if="getFieldError(EMAIL_FIELD)" :id="getErrorId(EMAIL_FIELD)" class="mt-1 text-xs text-red-700">
          {{ getFieldError(EMAIL_FIELD) }}
        </p>
      </div>
    </div>

    <div>
      <label :for="getFieldId(CONTACT_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ EMPLOYEE_FIELD_LABELS.contact + OPTIONAL_SUFFIX }}
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

    <fieldset :aria-describedby="getRolesDescribedBy()">
      <legend class="mb-1 text-sm font-semibold text-ink">Roles</legend>
      <div class="flex flex-wrap gap-4">
        <label
          v-for="option in EMPLOYEE_ROLE_OPTIONS"
          :key="option.value"
          class="inline-flex items-center gap-2 text-sm text-ink"
        >
          <input
            :id="getRoleCheckboxId(option.value)"
            type="checkbox"
            :class="CHECKBOX_CLASS"
            :checked="isRoleChecked(option.value)"
            :disabled="isDisabled || isRoleLocked(option.value)"
            @change="toggleRoleSelection(option.value)"
          />
          {{ option.label }}
        </label>
      </div>
      <p v-if="lockedRoles.length > 0" :id="LOCKED_ROLE_HINT_ID" class="mt-1 text-xs text-ink-muted">
        {{ LOCKED_ROLE_HINT }}
      </p>
      <p v-if="getFieldError(ROLES_FIELD)" :id="getErrorId(ROLES_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(ROLES_FIELD) }}
      </p>
    </fieldset>

    <EmployeePasswordFields
      v-if="isCreating"
      :id-prefix="FIELD_ID_PREFIX"
      :model-value="modelValue"
      :field-errors="fieldErrors"
      :is-disabled="isDisabled"
      @update:model-value="emitFormValues"
    />
  </div>
</template>
