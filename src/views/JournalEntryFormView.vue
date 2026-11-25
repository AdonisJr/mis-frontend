<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import JournalEntryFormFields from '@/components/JournalEntryFormFields.vue'
import JournalEntryTotals from '@/components/JournalEntryTotals.vue'
import JournalLineGrid from '@/components/JournalLineGrid.vue'
import ConfirmDialog from '@/components/modal/ConfirmDialog.vue'
import {
  JOURNAL_ENTRIES_ROUTE_NAME,
  JOURNAL_ENTRY_DETAIL_ROUTE_NAME,
  JOURNAL_ENTRY_EDIT_ROUTE_NAME,
} from '@/routeNames.js'
import { fetchAllAccounts } from '@/services/accountService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import {
  createJournalEntry,
  fetchJournalEntry,
  postJournalEntry,
  updateJournalEntry,
} from '@/services/journalEntryService.js'
import { toIsoDate } from '@/utils/enrollmentForm.js'
import { buildPostConfirmMessage, isJournalDraft } from '@/utils/journalEntryDisplay.js'
import {
  buildFormFromJournalEntry,
  buildJournalEntryPayload,
  createEmptyJournalEntryForm,
  findJournalEntryFormErrors,
} from '@/utils/journalEntryForm.js'
import { buildLineAccountOptions, canPostJournalEntry, sumJournalLines } from '@/utils/journalLineGrid.js'
import { toRecordId } from '@/utils/sectionForm.js'

const HTTP_UNPROCESSABLE_ENTITY = 422
const HTTP_NOT_FOUND = 404
const LINES_ERROR_PREFIX = 'lines'
const LOADING_TEXT = 'Loading…'
const NOT_FOUND_TEXT = 'Journal entry not found.'
const BACK_LABEL = 'Journal entries'
const POST_CONFIRM_TITLE = 'Post journal entry'

const LOAD_FAILED_MESSAGE = 'Could not load the journal entry.'
const SAVE_FAILED_MESSAGE = 'Could not save the journal entry.'
const POST_FAILED_MESSAGE = 'Could not post the journal entry.'
const INVALID_FIELDS_MESSAGE = 'Check the highlighted fields.'
const DRAFT_SAVED_MESSAGE = 'Draft saved.'
const NOT_DRAFT_MESSAGE = 'Posted entries cannot be changed. Reverse it instead.'

const SECONDARY_LINK_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1'
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const todayIso = toIsoDate(new Date())

const formValues = ref(createEmptyJournalEntryForm(todayIso))
const fieldErrors = ref({})
const storedLines = ref([])
const activeAccounts = ref([])
const isLoading = ref(false)
const isNotFound = ref(false)
const isSaving = ref(false)
const isPostConfirmOpen = ref(false)
let loadRequestId = 0
// a post refusal on a just-created draft must survive the reload after router.replace
let pendingPostErrors = null

const entryId = computed(() => toRecordId(route.params.entryId))
const isEditing = computed(() => entryId.value !== null)
const lineTotals = computed(() => sumJournalLines(formValues.value.lines))
const canPost = computed(() => canPostJournalEntry(lineTotals.value) && !isSaving.value)
const accountOptions = computed(() => buildLineAccountOptions(activeAccounts.value, storedLines.value))
const postConfirmMessage = computed(() => buildPostConfirmMessage(lineTotals.value))
const cancelTarget = computed(() =>
  isEditing.value
    ? { name: JOURNAL_ENTRY_DETAIL_ROUTE_NAME, params: { entryId: entryId.value } }
    : { name: JOURNAL_ENTRIES_ROUTE_NAME },
)

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

function openDetail(savedEntryId) {
  router.replace({ name: JOURNAL_ENTRY_DETAIL_ROUTE_NAME, params: { entryId: savedEntryId } })
}

function resetForm() {
  formValues.value = createEmptyJournalEntryForm(todayIso)
  fieldErrors.value = {}
  storedLines.value = []
  isNotFound.value = false
  isPostConfirmOpen.value = false
}

async function loadEditedEntry(requestId) {
  const entryResponse = await fetchJournalEntry(entryId.value)
  if (requestId !== loadRequestId) return
  const journalEntry = entryResponse?.journal_entry
  if (!isJournalDraft(journalEntry)) {
    toast.error(NOT_DRAFT_MESSAGE)
    openDetail(entryId.value)
    return
  }
  formValues.value = buildFormFromJournalEntry(journalEntry)
  storedLines.value = journalEntry.lines ?? []
  fieldErrors.value = pendingPostErrors ?? {}
  pendingPostErrors = null
}

async function loadForm() {
  const requestId = ++loadRequestId
  resetForm()
  isLoading.value = true
  try {
    const accountResponse = await fetchAllAccounts({ status: 'active' })
    if (requestId !== loadRequestId) return
    activeAccounts.value = accountResponse?.accounts ?? []
    if (isEditing.value) await loadEditedEntry(requestId)
  } catch (error) {
    if (requestId !== loadRequestId) return
    isNotFound.value = error.response?.status === HTTP_NOT_FOUND
    if (!isNotFound.value) toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === loadRequestId) isLoading.value = false
  }
}

function updateHeader(nextHeader) {
  formValues.value = { ...formValues.value, ...nextHeader }
}

function updateLines(nextLines) {
  formValues.value = { ...formValues.value, lines: nextLines }
}

function validateForm() {
  fieldErrors.value = findJournalEntryFormErrors(formValues.value, todayIso)
  if (Object.keys(fieldErrors.value).length === 0) return true
  toast.error(INVALID_FIELDS_MESSAGE)
  return false
}

async function saveDraftEntry() {
  const journalPayload = buildJournalEntryPayload(formValues.value)
  const saveResponse = isEditing.value
    ? await updateJournalEntry(entryId.value, journalPayload)
    : await createJournalEntry(journalPayload)
  return saveResponse?.journal_entry ?? null
}

function applySaveError(error) {
  const status = error.response?.status
  const validationErrors = error.response?.data?.errors
  if (status === HTTP_UNPROCESSABLE_ENTITY && validationErrors) fieldErrors.value = validationErrors
  if (status === HTTP_NOT_FOUND) isNotFound.value = true
  toastRequestError(error, SAVE_FAILED_MESSAGE)
}

async function saveDraft() {
  if (isSaving.value || !validateForm()) return
  isSaving.value = true
  try {
    const savedEntry = await saveDraftEntry()
    toast.success(DRAFT_SAVED_MESSAGE)
    openDetail(savedEntry?.id ?? entryId.value)
  } catch (error) {
    applySaveError(error)
  } finally {
    isSaving.value = false
  }
}

function openPostConfirm() {
  if (isSaving.value || !validateForm()) return
  isPostConfirmOpen.value = true
}

function closePostConfirm() {
  if (isSaving.value) return
  isPostConfirmOpen.value = false
}

function pickLineErrors(validationErrors) {
  const lineErrors = {}
  for (const [errorKey, messages] of Object.entries(validationErrors ?? {})) {
    if (errorKey.startsWith(LINES_ERROR_PREFIX)) lineErrors[errorKey] = messages
  }
  return lineErrors
}

function applyPostError(error, draftEntryId) {
  const lineErrors = pickLineErrors(error.response?.data?.errors)
  toastRequestError(error, POST_FAILED_MESSAGE)
  if (isEditing.value) {
    fieldErrors.value = lineErrors
    return
  }
  pendingPostErrors = lineErrors
  router.replace({ name: JOURNAL_ENTRY_EDIT_ROUTE_NAME, params: { entryId: draftEntryId } })
}

async function postSavedEntry(savedEntry) {
  try {
    const postResponse = await postJournalEntry(savedEntry.id)
    toast.success(`Entry posted as ${postResponse?.journal_entry?.number}.`)
    openDetail(savedEntry.id)
  } catch (error) {
    applyPostError(error, savedEntry.id)
  }
}

async function confirmPost() {
  if (isSaving.value) return
  isSaving.value = true
  try {
    const savedEntry = await saveDraftEntry()
    await postSavedEntry(savedEntry)
  } catch (error) {
    applySaveError(error)
  } finally {
    isSaving.value = false
    isPostConfirmOpen.value = false
  }
}

watch(entryId, loadForm, { immediate: true })
</script>

<template>
  <p v-if="isLoading" class="text-sm text-ink-muted">{{ LOADING_TEXT }}</p>

  <section v-if="isNotFound" class="rounded-lg border border-line bg-surface px-4 py-12 text-center">
    <p class="text-sm font-bold text-ink">{{ NOT_FOUND_TEXT }}</p>
    <RouterLink
      :to="{ name: JOURNAL_ENTRIES_ROUTE_NAME }"
      class="mt-2 inline-block text-sm font-semibold text-accent hover:underline focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1"
    >
      {{ BACK_LABEL }}
    </RouterLink>
  </section>

  <div v-if="!isLoading && !isNotFound" class="space-y-4">
    <RouterLink
      :to="{ name: JOURNAL_ENTRIES_ROUTE_NAME }"
      class="inline-block text-sm font-semibold text-accent hover:underline focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1"
    >
      {{ BACK_LABEL }}
    </RouterLink>
    <form novalidate class="space-y-4 rounded-lg border border-line bg-surface p-4" @submit.prevent="saveDraft">
      <JournalEntryFormFields
        :model-value="formValues"
        :field-errors="fieldErrors"
        :is-disabled="isSaving"
        :max-date="todayIso"
        @update:model-value="updateHeader"
      />
      <JournalLineGrid
        :model-value="formValues.lines"
        :account-options="accountOptions"
        :field-errors="fieldErrors"
        :is-disabled="isSaving"
        @update:model-value="updateLines"
      />
      <JournalEntryTotals :line-totals="lineTotals" />
      <div class="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
        <RouterLink :to="cancelTarget" :class="SECONDARY_LINK_CLASS">Cancel</RouterLink>
        <button type="submit" :class="SECONDARY_BUTTON_CLASS" :disabled="isSaving">
          {{ isSaving ? 'Saving…' : 'Save draft' }}
        </button>
        <button type="button" :class="PRIMARY_BUTTON_CLASS" :disabled="!canPost" @click="openPostConfirm">Post</button>
      </div>
    </form>
  </div>

  <ConfirmDialog
    :is-open="isPostConfirmOpen"
    :title="POST_CONFIRM_TITLE"
    :message="postConfirmMessage"
    confirm-label="Post"
    :is-loading="isSaving"
    @confirm="confirmPost"
    @cancel="closePostConfirm"
  />
</template>
