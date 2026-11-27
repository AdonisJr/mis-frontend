<script setup>
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/modal/Modal.vue'
import ConfirmDialog from '@/components/modal/ConfirmDialog.vue'
import MobileAccountStatusActions from '@/components/MobileAccountStatusActions.vue'
import MobileAccountPasswordReveal from '@/components/MobileAccountPasswordReveal.vue'
import MobileAccountSlipSheet from '@/components/MobileAccountSlipSheet.vue'
import {
  createStudentMobileAccount,
  deactivateStudentMobileAccount,
  fetchStudentMobileAccount,
  reactivateStudentMobileAccount,
  resetStudentMobilePassword,
} from '@/services/mobileAccountService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { useSchoolYearStore } from '@/stores/schoolYearStore.js'
import { formatCurrentEnrollment, formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'
import {
  MOBILE_ACCOUNT_ACTION_CREATE,
  MOBILE_ACCOUNT_ACTION_DEACTIVATE,
  MOBILE_ACCOUNT_ACTION_REACTIVATE,
  MOBILE_ACCOUNT_ACTION_RESET,
  buildMobileAccountConfirm,
  buildSlipContext,
  buildSlipRows,
  buildStudentAccountEntry,
} from '@/utils/mobileAccountDisplay.js'

const PANEL_TITLE = 'Mobile account'
const REVEAL_TITLE = 'Temporary password'
const LOADING_TEXT = 'Loading…'
const LOAD_FAILED_MESSAGE = 'Could not load the mobile account.'
const ACTION_FAILED_MESSAGE = 'Could not update the mobile account.'
const COPY_SUCCESS_MESSAGE = 'Password copied.'
const COPY_FAILED_MESSAGE = 'Could not copy. Select the password and copy it by hand.'
const ACTION_SERVICES = Object.freeze({
  [MOBILE_ACCOUNT_ACTION_CREATE]: createStudentMobileAccount,
  [MOBILE_ACCOUNT_ACTION_RESET]: resetStudentMobilePassword,
  [MOBILE_ACCOUNT_ACTION_DEACTIVATE]: deactivateStudentMobileAccount,
  [MOBILE_ACCOUNT_ACTION_REACTIVATE]: reactivateStudentMobileAccount,
})
const ACTION_SUCCESS_MESSAGES = Object.freeze({
  [MOBILE_ACCOUNT_ACTION_CREATE]: 'Mobile account created.',
  [MOBILE_ACCOUNT_ACTION_RESET]: 'Temporary password reset.',
  [MOBILE_ACCOUNT_ACTION_DEACTIVATE]: 'Mobile account deactivated.',
  [MOBILE_ACCOUNT_ACTION_REACTIVATE]: 'Mobile account reactivated.',
})

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  student: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const account = ref(null)
const isStatusLoading = ref(false)
const hasStatusLoadFailed = ref(false)
const pendingAction = ref(null)
const isActionBusy = ref(false)
const revealedSlipRows = ref([])
let statusRequestId = 0

const toast = useToast()
const schoolYearStore = useSchoolYearStore()

const isRevealOpen = computed(() => revealedSlipRows.value.length > 0)
const isConfirmOpen = computed(() => pendingAction.value !== null)
const isPanelOpen = computed(() => props.student !== null && !isConfirmOpen.value && !isRevealOpen.value)
const studentName = computed(() => formatEnrollmentStudentName(props.student))
const confirmContent = computed(() => buildMobileAccountConfirm(pendingAction.value, studentName.value))
const accountStatus = computed(() => account.value?.status ?? '')

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadAccountStatus() {
  const requestId = ++statusRequestId
  account.value = null
  hasStatusLoadFailed.value = false
  isStatusLoading.value = true
  try {
    const statusResponse = await fetchStudentMobileAccount(props.student.id)
    if (requestId !== statusRequestId) return
    account.value = statusResponse.account
  } catch (error) {
    if (requestId !== statusRequestId) return
    hasStatusLoadFailed.value = true
    toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === statusRequestId) isStatusLoading.value = false
  }
}

function applyActionResponse(action, actionResponse) {
  account.value = actionResponse.account
  toast.success(ACTION_SUCCESS_MESSAGES[action])
  if (typeof actionResponse.temporary_password !== 'string') return
  const slipContext = buildSlipContext(formatCurrentEnrollment(props.student), schoolYearStore.activeSchoolYear?.name)
  const accountEntry = buildStudentAccountEntry(props.student, actionResponse.temporary_password)
  revealedSlipRows.value = buildSlipRows([accountEntry], slipContext)
}

async function runAction(action) {
  if (isActionBusy.value) return
  isActionBusy.value = true
  try {
    applyActionResponse(action, await ACTION_SERVICES[action](props.student.id))
  } catch (error) {
    toastRequestError(error, ACTION_FAILED_MESSAGE)
    loadAccountStatus()
  } finally {
    isActionBusy.value = false
    pendingAction.value = null
  }
}

function requestAction(action) {
  if (action === MOBILE_ACCOUNT_ACTION_CREATE) return runAction(action)
  pendingAction.value = action
}

function confirmPendingAction() {
  return runAction(pendingAction.value)
}

function cancelPendingAction() {
  if (isActionBusy.value) return
  pendingAction.value = null
}

function closePanel() {
  if (isActionBusy.value) return
  emit('close')
}

function closeReveal() {
  revealedSlipRows.value = []
}

async function copyTemporaryPassword() {
  try {
    await navigator.clipboard.writeText(revealedSlipRows.value[0].temporaryPassword)
    toast.success(COPY_SUCCESS_MESSAGE)
  } catch {
    toast.error(COPY_FAILED_MESSAGE)
  }
}

function printSlip() {
  window.print()
}

watch(
  () => props.student?.id,
  (studentId) => {
    revealedSlipRows.value = []
    pendingAction.value = null
    if (studentId === undefined) return
    loadAccountStatus()
  },
  { immediate: true },
)
</script>

<template>
  <Modal :is-open="isPanelOpen" :title="PANEL_TITLE" @close="closePanel">
    <div class="flex flex-col gap-3">
      <div>
        <p class="text-sm font-bold text-ink">{{ studentName }}</p>
        <p class="text-xs text-ink-muted">LRN <span class="font-mono">{{ student?.lrn }}</span></p>
      </div>
      <p v-if="isStatusLoading" class="text-sm text-ink-muted">{{ LOADING_TEXT }}</p>
      <p v-else-if="hasStatusLoadFailed" class="text-sm text-red-700">{{ LOAD_FAILED_MESSAGE }}</p>
      <MobileAccountStatusActions
        v-else-if="account !== null"
        :status="accountStatus"
        :is-busy="isActionBusy"
        @create="requestAction(MOBILE_ACCOUNT_ACTION_CREATE)"
        @reset="requestAction(MOBILE_ACCOUNT_ACTION_RESET)"
        @deactivate="requestAction(MOBILE_ACCOUNT_ACTION_DEACTIVATE)"
        @reactivate="requestAction(MOBILE_ACCOUNT_ACTION_REACTIVATE)"
      />
    </div>
    <template #footer>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" :disabled="isActionBusy" @click="closePanel">Close</button>
    </template>
  </Modal>

  <ConfirmDialog
    :is-open="isConfirmOpen"
    :title="confirmContent?.title ?? ''"
    :message="confirmContent?.message ?? ''"
    :confirm-label="confirmContent?.confirmLabel"
    :is-destructive="confirmContent?.isDestructive ?? false"
    :is-loading="isActionBusy"
    @confirm="confirmPendingAction"
    @cancel="cancelPendingAction"
  />

  <Modal :is-open="isRevealOpen" :title="REVEAL_TITLE" @close="closeReveal">
    <MobileAccountPasswordReveal
      v-if="isRevealOpen"
      :slip-row="revealedSlipRows[0]"
      @copy="copyTemporaryPassword"
      @print="printSlip"
    />
    <template #footer>
      <button type="button" :class="PRIMARY_BUTTON_CLASS" @click="closeReveal">Done</button>
    </template>
  </Modal>

  <MobileAccountSlipSheet :slip-rows="revealedSlipRows" />
</template>
