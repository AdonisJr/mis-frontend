<script setup>
import { computed, ref } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/modal/Modal.vue'
import ConfirmDialog from '@/components/modal/ConfirmDialog.vue'
import MobileAccountGenerateResult from '@/components/MobileAccountGenerateResult.vue'
import MobileAccountSlipSheet from '@/components/MobileAccountSlipSheet.vue'
import { generateSectionMobileAccounts } from '@/services/mobileAccountService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { buildSectionOptionLabel } from '@/utils/enrollmentForm.js'
import {
  buildGenerateConfirmMessage,
  buildGenerateResultText,
  buildSlipContext,
  buildSlipRows,
} from '@/utils/mobileAccountDisplay.js'

const CONFIRM_TITLE = 'Generate mobile accounts'
const CONFIRM_LABEL = 'Generate'
const RESULT_TITLE = 'Generated mobile accounts'
const GENERATE_SUCCESS_MESSAGE = 'Mobile accounts generated.'
const GENERATE_FAILED_MESSAGE = 'Could not generate mobile accounts.'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  section: { type: Object, default: null },
  schoolYearName: { type: String, required: true },
})

const emit = defineEmits(['close'])

const generateResult = ref(null)
const isGenerating = ref(false)

const toast = useToast()

const sectionLabel = computed(() => {
  if (props.section === null) return ''
  // seat counts are not needed on the slip, so the label carries no seats suffix
  return buildSectionOptionLabel({ ...props.section, enrolled_count: null }, '')
})
const isResultOpen = computed(() => generateResult.value !== null)
const isConfirmOpen = computed(() => props.section !== null && !isResultOpen.value)
const confirmMessage = computed(() => buildGenerateConfirmMessage(sectionLabel.value))
const canPrint = computed(() => (generateResult.value?.slipRows.length ?? 0) > 0)

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function confirmGenerate() {
  if (isGenerating.value) return
  isGenerating.value = true
  try {
    const generateResponse = await generateSectionMobileAccounts(props.section.id)
    const slipContext = buildSlipContext(sectionLabel.value, props.schoolYearName)
    generateResult.value = {
      resultText: buildGenerateResultText(generateResponse),
      slipRows: buildSlipRows(generateResponse.accounts, slipContext),
    }
    toast.success(GENERATE_SUCCESS_MESSAGE)
  } catch (error) {
    toastRequestError(error, GENERATE_FAILED_MESSAGE)
    emit('close')
  } finally {
    isGenerating.value = false
  }
}

function cancelGenerate() {
  if (isGenerating.value) return
  emit('close')
}

function closeResult() {
  generateResult.value = null
  emit('close')
}

function printSlips() {
  window.print()
}
</script>

<template>
  <ConfirmDialog
    :is-open="isConfirmOpen"
    :title="CONFIRM_TITLE"
    :message="confirmMessage"
    :confirm-label="CONFIRM_LABEL"
    :is-loading="isGenerating"
    @confirm="confirmGenerate"
    @cancel="cancelGenerate"
  />

  <Modal :is-open="isResultOpen" :title="RESULT_TITLE" @close="closeResult">
    <MobileAccountGenerateResult
      v-if="isResultOpen"
      :result-text="generateResult.resultText"
      :slip-rows="generateResult.slipRows"
    />
    <template #footer>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" :disabled="!canPrint" @click="printSlips">
        Print slips
      </button>
      <button type="button" :class="PRIMARY_BUTTON_CLASS" @click="closeResult">Done</button>
    </template>
  </Modal>

  <MobileAccountSlipSheet :slip-rows="generateResult?.slipRows ?? []" />
</template>
