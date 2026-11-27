<script setup>
import { computed } from 'vue'
import { KeyRound, UserCheck, UserPlus, UserX } from '@lucide/vue'
import {
  MOBILE_ACCOUNT_ACTION_CREATE,
  MOBILE_ACCOUNT_ACTION_DEACTIVATE,
  MOBILE_ACCOUNT_ACTION_REACTIVATE,
  MOBILE_ACCOUNT_ACTION_RESET,
  getMobileAccountStatusChip,
  listMobileAccountActions,
} from '@/utils/mobileAccountDisplay.js'

const CHIP_CLASS = 'rounded-full px-2.5 py-0.5 text-xs font-bold'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const DESTRUCTIVE_TEXT_CLASS = 'text-red-700'
const ACTION_BUTTONS = Object.freeze({
  [MOBILE_ACCOUNT_ACTION_CREATE]: Object.freeze({
    label: 'Create account',
    icon: UserPlus,
    buttonClass: PRIMARY_BUTTON_CLASS,
  }),
  [MOBILE_ACCOUNT_ACTION_RESET]: Object.freeze({
    label: 'Reset password',
    icon: KeyRound,
    buttonClass: SECONDARY_BUTTON_CLASS,
  }),
  [MOBILE_ACCOUNT_ACTION_DEACTIVATE]: Object.freeze({
    label: 'Deactivate',
    icon: UserX,
    buttonClass: `${SECONDARY_BUTTON_CLASS} ${DESTRUCTIVE_TEXT_CLASS}`,
  }),
  [MOBILE_ACCOUNT_ACTION_REACTIVATE]: Object.freeze({
    label: 'Reactivate',
    icon: UserCheck,
    buttonClass: SECONDARY_BUTTON_CLASS,
  }),
})

const props = defineProps({
  status: { type: String, required: true },
  isBusy: { type: Boolean, default: false },
})

const emit = defineEmits([
  MOBILE_ACCOUNT_ACTION_CREATE,
  MOBILE_ACCOUNT_ACTION_RESET,
  MOBILE_ACCOUNT_ACTION_DEACTIVATE,
  MOBILE_ACCOUNT_ACTION_REACTIVATE,
])

const statusChip = computed(() => getMobileAccountStatusChip(props.status))
const actionButtons = computed(() =>
  listMobileAccountActions(props.status).map((action) => ({ action, ...ACTION_BUTTONS[action] })),
)
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center gap-2 text-sm text-ink">
      <span>Status</span>
      <span :class="[CHIP_CLASS, statusChip.colorClass]">{{ statusChip.label }}</span>
    </div>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="actionButton in actionButtons"
        :key="actionButton.action"
        type="button"
        :class="actionButton.buttonClass"
        :disabled="isBusy"
        @click="emit(actionButton.action)"
      >
        <component :is="actionButton.icon" :size="16" aria-hidden="true" />
        {{ actionButton.label }}
      </button>
    </div>
  </div>
</template>
