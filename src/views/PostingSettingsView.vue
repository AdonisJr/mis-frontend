<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import PostingMappingGroup from '@/components/PostingMappingGroup.vue'
import UnpostedEventsPanel from '@/components/UnpostedEventsPanel.vue'
import ConfirmDialog from '@/components/modal/ConfirmDialog.vue'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { fetchAllAccounts } from '@/services/accountService.js'
import {
  fetchPostingMappings,
  fetchUnpostedEvents,
  postPendingEvents,
  updatePostingMappings,
} from '@/services/postingSettingsService.js'
import {
  MAPPING_ERROR_PREFIX,
  NO_CHANGES_MESSAGE,
  buildMappingPayload,
  createMappingSelections,
  groupPostingMappings,
} from '@/utils/postingSettingsForm.js'
import { FIRST_PAGE, isPageBeyondLast } from '@/utils/studentSearch.js'
import {
  POST_PENDING_CONFIRM_MESSAGE,
  POST_PENDING_TITLE,
  TOAST_KIND_ERROR,
  TOAST_KIND_WARNING,
  buildPostPendingSummary,
  buildUnpostedRows,
  pickPostPendingToastKind,
} from '@/utils/unpostedEventsDisplay.js'

const HTTP_UNPROCESSABLE_ENTITY = 422
const LOADING_TEXT = 'Loading…'
const SAVING_LABEL = 'Saving…'
const SAVE_LABEL = 'Save'
const POST_PENDING_LABEL = 'Post pending'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const MAPPINGS_FAILED_MESSAGE = 'Could not load posting settings.'
const UNPOSTED_FAILED_MESSAGE = 'Could not load unposted events.'
const SAVE_FAILED_MESSAGE = 'Could not save posting settings.'
const SAVE_SUCCESS_MESSAGE = 'Posting settings saved.'
const POST_FAILED_MESSAGE = 'Could not post pending events.'

function createEmptyPageMeta() {
  return { current_page: 1, last_page: 1, per_page: 15, total: 0 }
}

const postingMappings = ref([])
const mappingSelections = ref({})
const fieldErrors = ref({})
const activeAccounts = ref([])
const isMappingLoading = ref(false)
const isSaving = ref(false)
const unpostedEvents = ref([])
const unpostedMeta = ref(createEmptyPageMeta())
const unpostedPage = ref(FIRST_PAGE)
const isUnpostedLoading = ref(false)
const isPostConfirmOpen = ref(false)
const isPosting = ref(false)
const postSummary = ref(null)
let unpostedRequestId = 0

const toast = useToast()

const mappingGroups = computed(() => groupPostingMappings(postingMappings.value))
const unpostedRows = computed(() => buildUnpostedRows(unpostedEvents.value))
const isFirstLoad = computed(() => isMappingLoading.value && postingMappings.value.length === 0)

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

function applyMappings(mappingResponse) {
  postingMappings.value = mappingResponse?.posting_mappings ?? []
  mappingSelections.value = createMappingSelections(postingMappings.value)
}

async function loadMappings() {
  isMappingLoading.value = true
  try {
    const [mappingResponse, accountResponse] = await Promise.all([
      fetchPostingMappings(),
      fetchAllAccounts({ status: 'active' }),
    ])
    applyMappings(mappingResponse)
    activeAccounts.value = accountResponse?.accounts ?? []
  } catch (error) {
    toastRequestError(error, MAPPINGS_FAILED_MESSAGE)
  } finally {
    isMappingLoading.value = false
  }
}

async function loadUnpostedEvents() {
  const requestId = ++unpostedRequestId
  isUnpostedLoading.value = true
  try {
    const unpostedResponse = await fetchUnpostedEvents({ page: unpostedPage.value })
    if (requestId !== unpostedRequestId) return
    if (isPageBeyondLast(unpostedResponse?.meta)) {
      unpostedPage.value = unpostedResponse.meta.last_page
      loadUnpostedEvents()
      return
    }
    unpostedEvents.value = unpostedResponse?.unposted_events ?? []
    unpostedMeta.value = unpostedResponse?.meta ?? createEmptyPageMeta()
  } catch (error) {
    if (requestId !== unpostedRequestId) return
    toastRequestError(error, UNPOSTED_FAILED_MESSAGE)
  } finally {
    if (requestId === unpostedRequestId) isUnpostedLoading.value = false
  }
}

function updateSelection(purpose, accountIdText) {
  mappingSelections.value = { ...mappingSelections.value, [purpose]: accountIdText }
  const remainingErrors = { ...fieldErrors.value }
  delete remainingErrors[MAPPING_ERROR_PREFIX + purpose]
  fieldErrors.value = remainingErrors
}

function showSaveFailure(error) {
  const validationErrors = error.response?.data?.errors
  const isValidationFailure = error.response?.status === HTTP_UNPROCESSABLE_ENTITY && validationErrors
  if (!isValidationFailure) return toastRequestError(error, SAVE_FAILED_MESSAGE)
  fieldErrors.value = validationErrors
  toast.error(error.response.data.message ?? SAVE_FAILED_MESSAGE)
}

async function saveMappings() {
  if (isSaving.value) return
  const mappingPayload = buildMappingPayload(postingMappings.value, mappingSelections.value)
  if (!mappingPayload) return toast.info(NO_CHANGES_MESSAGE)
  isSaving.value = true
  try {
    const saveResponse = await updatePostingMappings(mappingPayload)
    applyMappings(saveResponse)
    fieldErrors.value = {}
    toast.success(SAVE_SUCCESS_MESSAGE)
    loadUnpostedEvents()
  } catch (error) {
    showSaveFailure(error)
  } finally {
    isSaving.value = false
  }
}

function openPostPending() {
  isPostConfirmOpen.value = true
}

function closePostPending() {
  if (isPosting.value) return
  isPostConfirmOpen.value = false
}

function changeUnpostedPage(nextPage) {
  unpostedPage.value = nextPage
  loadUnpostedEvents()
}

function buildPostToastText(toastKind, summary) {
  if (toastKind === TOAST_KIND_ERROR) return summary.failedText
  if (toastKind === TOAST_KIND_WARNING) return `${summary.postedText} ${summary.failedText}`
  return summary.postedText
}

function showPostResult(postPendingResponse) {
  postSummary.value = buildPostPendingSummary(postPendingResponse)
  const toastKind = pickPostPendingToastKind(postPendingResponse)
  toast[toastKind](buildPostToastText(toastKind, postSummary.value))
}

async function confirmPostPending() {
  if (isPosting.value) return
  isPosting.value = true
  try {
    showPostResult(await postPendingEvents())
    unpostedPage.value = FIRST_PAGE
    loadUnpostedEvents()
  } catch (error) {
    toastRequestError(error, POST_FAILED_MESSAGE)
  } finally {
    isPosting.value = false
    isPostConfirmOpen.value = false
  }
}

onMounted(() => {
  loadMappings()
  loadUnpostedEvents()
})
</script>

<template>
  <div class="space-y-4">
    <section class="rounded-lg border border-line bg-surface">
      <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 class="text-sm font-bold text-ink">Account mapping</h2>
        <button
          type="button"
          :class="PRIMARY_BUTTON_CLASS"
          :disabled="isSaving || isMappingLoading"
          @click="saveMappings"
        >
          {{ isSaving ? SAVING_LABEL : SAVE_LABEL }}
        </button>
      </div>
      <p v-if="isFirstLoad" class="px-4 py-3 text-sm text-ink-muted" role="status">{{ LOADING_TEXT }}</p>
      <div v-else class="grid gap-4 p-4 lg:grid-cols-2">
        <PostingMappingGroup
          v-for="mappingGroup in mappingGroups"
          :key="mappingGroup.group"
          :group="mappingGroup.label"
          :mappings="mappingGroup.mappings"
          :selections="mappingSelections"
          :active-accounts="activeAccounts"
          :field-errors="fieldErrors"
          :is-disabled="isSaving"
          @update:selection="updateSelection"
        />
      </div>
    </section>

    <UnpostedEventsPanel
      :rows="unpostedRows"
      :page-meta="unpostedMeta"
      :is-loading="isUnpostedLoading"
      :is-posting="isPosting"
      :post-summary="postSummary"
      @post-pending="openPostPending"
      @change-page="changeUnpostedPage"
    />

    <ConfirmDialog
      :is-open="isPostConfirmOpen"
      :title="POST_PENDING_TITLE"
      :message="POST_PENDING_CONFIRM_MESSAGE"
      :confirm-label="POST_PENDING_LABEL"
      :is-loading="isPosting"
      @confirm="confirmPostPending"
      @cancel="closePostPending"
    />
  </div>
</template>
