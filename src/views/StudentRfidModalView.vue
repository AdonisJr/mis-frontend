<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/modal/Modal.vue'
import ConfirmDialog from '@/components/modal/ConfirmDialog.vue'
import RfidScanPrompt from '@/components/RfidScanPrompt.vue'
import { closeRfidChannel, openRfidChannel } from '@/services/rfidService.js'
import { leaveRfidChannel, listenForRfidScans } from '@/services/echo.js'
import { deleteStudentRfid, updateStudentRfid } from '@/services/studentService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'
import {
  ASSIGNMENT_WINDOW_SECONDS,
  NO_CARD_LABEL,
  RFID_ACTION_SCAN,
  RFID_ACTION_UNASSIGN,
  extractRfidConflictMessage,
  formatCardUid,
  formatCountdown,
  getRemainingSeconds,
} from '@/utils/rfidDisplay.js'

const PANEL_TITLE = 'Assign RFID card'
const ASSIGN_SUCCESS_MESSAGE = 'Card assigned.'
const UNASSIGN_SUCCESS_MESSAGE = 'Card removed.'
const ASSIGN_FAILED_MESSAGE = 'Could not assign the card.'
const UNASSIGN_FAILED_MESSAGE = 'Could not remove the card.'
const OPEN_FAILED_MESSAGE = 'Could not open the scanner window.'
const LIVE_FAILED_MESSAGE = 'Could not connect to live scanning.'
const HTTP_NOT_FOUND = 404
const COUNTDOWN_TICK_MS = 1000
const CONFIRM_REPLACE = 'replace'
const CONFIRM_UNASSIGN = 'unassign'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const DANGER_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const NO_CARD_CHIP_CLASS = 'rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700'

const props = defineProps({
  student: { type: Object, default: null },
  startAction: { type: String, default: RFID_ACTION_SCAN },
})

const emit = defineEmits(['close', 'changed'])

const scannedUid = ref('')
const conflictMessage = ref('')
const isOpeningWindow = ref(false)
const isWindowOpen = ref(false)
const remainingSeconds = ref(0)
const pendingConfirm = ref(null)
const isSaving = ref(false)
let sessionId = 0
let isSessionActive = false
let windowDeadlineMs = 0
let countdownTimer = null

const toast = useToast()

const studentName = computed(() => formatEnrollmentStudentName(props.student))
const currentCardUid = computed(() => formatCardUid(props.student?.rfid))
const hasCurrentCard = computed(() => Boolean(props.student?.rfid))
const isConfirmOpen = computed(() => pendingConfirm.value !== null)
const isPanelOpen = computed(
  () => props.student !== null && props.startAction === RFID_ACTION_SCAN && !isConfirmOpen.value,
)
const countdownText = computed(() => formatCountdown(remainingSeconds.value))
const canAssign = computed(() => scannedUid.value !== '' && !isSaving.value)
const confirmContent = computed(() => {
  if (pendingConfirm.value === CONFIRM_REPLACE) {
    return {
      title: 'Replace card',
      message: `${studentName.value} already has card ${props.student.rfid}. Replace it with ${scannedUid.value}?`,
      confirmLabel: 'Replace',
      isDestructive: false,
    }
  }
  if (pendingConfirm.value !== CONFIRM_UNASSIGN) return null
  return {
    title: 'Remove card',
    message: `Remove card ${props.student.rfid} from ${studentName.value}? The card stops working for attendance until it is assigned again.`,
    confirmLabel: 'Remove',
    isDestructive: true,
  }
})

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

function stopCountdown() {
  clearInterval(countdownTimer)
  countdownTimer = null
}

function tickCountdown() {
  remainingSeconds.value = getRemainingSeconds(windowDeadlineMs, Date.now())
  if (remainingSeconds.value > 0) return
  isWindowOpen.value = false
  stopCountdown()
}

function startCountdown() {
  windowDeadlineMs = Date.now() + ASSIGNMENT_WINDOW_SECONDS * 1000
  isWindowOpen.value = true
  tickCountdown()
  countdownTimer = setInterval(tickCountdown, COUNTDOWN_TICK_MS)
}

async function openScanWindow() {
  const openSessionId = sessionId
  isOpeningWindow.value = true
  try {
    await openRfidChannel()
    if (openSessionId !== sessionId) {
      // the modal closed while the request was in flight; the server window it opened must not stay open
      closeRfidChannel().catch(() => {})
      return
    }
    startCountdown()
  } catch (error) {
    if (openSessionId === sessionId) toastRequestError(error, OPEN_FAILED_MESSAGE)
  } finally {
    if (openSessionId === sessionId) isOpeningWindow.value = false
  }
}

function applyScannedUid(scanUid) {
  if (!isSessionActive) return
  scannedUid.value = scanUid
  conflictMessage.value = ''
}

function reportLiveError() {
  toast.error(LIVE_FAILED_MESSAGE)
}

function startScanSession() {
  sessionId++
  isSessionActive = true
  try {
    listenForRfidScans(applyScannedUid, reportLiveError)
  } catch {
    // a missing Pusher setting must not block the manual flow
    reportLiveError()
  }
  openScanWindow()
}

function endScanSession() {
  if (!isSessionActive) return
  isSessionActive = false
  sessionId++
  stopCountdown()
  leaveRfidChannel()
  // fire-and-forget cleanup: the window expires on its own if this fails
  closeRfidChannel().catch(() => {})
  isWindowOpen.value = false
  remainingSeconds.value = 0
}

function resetModalState() {
  scannedUid.value = ''
  conflictMessage.value = ''
  pendingConfirm.value = null
}

function rescanCard() {
  if (isOpeningWindow.value) return
  scannedUid.value = ''
  conflictMessage.value = ''
  stopCountdown()
  if (!isSessionActive) return startScanSession()
  openScanWindow()
}

function requestUnassign() {
  pendingConfirm.value = CONFIRM_UNASSIGN
}

function finishChange(successMessage) {
  toast.success(successMessage)
  emit('changed')
  emit('close')
}

function applyCardError(error, fallbackMessage) {
  const holderMessage = extractRfidConflictMessage(error)
  if (holderMessage) {
    conflictMessage.value = holderMessage
    return
  }
  toastRequestError(error, fallbackMessage)
  if (error.response?.status === HTTP_NOT_FOUND) emit('changed')
  const isUnassignMode = props.startAction === RFID_ACTION_UNASSIGN
  // unassign mode shows no panel, so control goes back to the host
  if (error.response?.status === HTTP_NOT_FOUND || isUnassignMode) emit('close')
}

async function saveCard() {
  if (isSaving.value) return
  isSaving.value = true
  try {
    await updateStudentRfid(props.student.id, scannedUid.value)
    finishChange(ASSIGN_SUCCESS_MESSAGE)
  } catch (error) {
    applyCardError(error, ASSIGN_FAILED_MESSAGE)
  } finally {
    isSaving.value = false
    pendingConfirm.value = null
  }
}

async function removeCard() {
  if (isSaving.value) return
  isSaving.value = true
  try {
    await deleteStudentRfid(props.student.id)
    finishChange(UNASSIGN_SUCCESS_MESSAGE)
  } catch (error) {
    applyCardError(error, UNASSIGN_FAILED_MESSAGE)
  } finally {
    isSaving.value = false
    pendingConfirm.value = null
  }
}

function requestAssign() {
  if (!canAssign.value) return
  const isDifferentCard = hasCurrentCard.value && props.student.rfid !== scannedUid.value
  if (isDifferentCard) {
    pendingConfirm.value = CONFIRM_REPLACE
    return
  }
  saveCard()
}

function confirmPending() {
  if (pendingConfirm.value === CONFIRM_UNASSIGN) return removeCard()
  return saveCard()
}

function cancelPending() {
  if (isSaving.value) return
  pendingConfirm.value = null
  if (props.startAction === RFID_ACTION_UNASSIGN) emit('close')
}

function closePanel() {
  if (isSaving.value) return
  emit('close')
}

watch(
  () => [props.student?.id, props.startAction],
  ([studentId]) => {
    endScanSession()
    resetModalState()
    if (studentId === undefined) return
    if (props.startAction === RFID_ACTION_UNASSIGN) return requestUnassign()
    startScanSession()
  },
  { immediate: true },
)

onBeforeUnmount(endScanSession)
</script>

<template>
  <Modal :is-open="isPanelOpen" :title="PANEL_TITLE" @close="closePanel">
    <div class="flex flex-col gap-3">
      <div>
        <p class="text-sm font-bold text-ink">{{ studentName }}</p>
        <p class="text-xs text-ink-muted">LRN <span class="font-mono">{{ student?.lrn }}</span></p>
        <p class="mt-1 text-xs text-ink-muted">
          Current card
          <span v-if="hasCurrentCard" class="font-mono text-xs text-ink">{{ currentCardUid }}</span>
          <span v-else :class="NO_CARD_CHIP_CLASS">{{ NO_CARD_LABEL }}</span>
        </p>
      </div>
      <RfidScanPrompt
        :is-opening="isOpeningWindow"
        :is-window-open="isWindowOpen"
        :countdown-text="countdownText"
        :scanned-uid="scannedUid"
      />
      <p v-if="conflictMessage" role="alert" class="text-xs text-red-700">{{ conflictMessage }}</p>
    </div>
    <template #footer>
      <button v-if="hasCurrentCard" type="button" :class="DANGER_BUTTON_CLASS" @click="requestUnassign">Unassign</button>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" :disabled="isOpeningWindow || isSaving" @click="rescanCard">
        Rescan
      </button>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" :disabled="isSaving" @click="closePanel">Close</button>
      <button type="button" :class="PRIMARY_BUTTON_CLASS" :disabled="!canAssign" @click="requestAssign">
        {{ isSaving ? 'Saving…' : 'Assign' }}
      </button>
    </template>
  </Modal>

  <ConfirmDialog
    :is-open="isConfirmOpen"
    :title="confirmContent?.title ?? ''"
    :message="confirmContent?.message ?? ''"
    :confirm-label="confirmContent?.confirmLabel"
    :is-destructive="confirmContent?.isDestructive ?? false"
    :is-loading="isSaving"
    @confirm="confirmPending"
    @cancel="cancelPending"
  />
</template>
