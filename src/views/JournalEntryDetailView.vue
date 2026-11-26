<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import DataTable from '@/components/DataTable.vue'
import JournalEntryTotals from '@/components/JournalEntryTotals.vue'
import JournalSourceBadge from '@/components/JournalSourceBadge.vue'
import ConfirmDialog from '@/components/modal/ConfirmDialog.vue'
import JournalEntryReverseModalView from '@/views/JournalEntryReverseModalView.vue'
import {
  JOURNAL_ENTRIES_ROUTE_NAME,
  JOURNAL_ENTRY_DETAIL_ROUTE_NAME,
  JOURNAL_ENTRY_EDIT_ROUTE_NAME,
} from '@/routeNames.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { deleteJournalEntry, fetchJournalEntry } from '@/services/journalEntryService.js'
import { formatTimestampDate } from '@/utils/assessmentDisplay.js'
import { formatDisplayDate } from '@/utils/dateDisplay.js'
import { formatLedgerCell } from '@/utils/generalLedgerDisplay.js'
import {
  JOURNAL_LINE_COLUMNS,
  buildDeleteDraftMessage,
  buildJournalLinks,
  buildServerTotals,
  buildSourceLinkTarget,
  canEditJournalDraft,
  canReverseJournalEntry,
  formatJournalNumber,
  getJournalStatusChip,
} from '@/utils/journalEntryDisplay.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'
import { toRecordId } from '@/utils/sectionForm.js'

const HTTP_NOT_FOUND = 404
const LINE_ROW_KEY = 'id'
const LOADING_TEXT = 'Loading…'
const NOT_FOUND_TEXT = 'Journal entry not found.'
const BACK_LABEL = 'Journal entries'
const DELETE_TITLE = 'Delete draft'
const LINES_EMPTY_TEXT = 'This entry has no lines.'
const CHIP_CLASS = 'rounded-full px-2.5 py-0.5 text-xs font-bold'

const LOAD_FAILED_MESSAGE = 'Could not load the journal entry.'
const DELETE_FAILED_MESSAGE = 'Could not delete the draft.'
const DELETE_SUCCESS_MESSAGE = 'Draft deleted.'
const REVERSE_SUCCESS_MESSAGE = 'Entry reversed.'

const LINK_CLASS =
  'rounded-md font-semibold text-accent hover:underline focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1'
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const DESTRUCTIVE_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const journalEntry = ref(null)
const isLoading = ref(false)
const isNotFound = ref(false)
const isDeleteOpen = ref(false)
const isDeleting = ref(false)
const isReverseOpen = ref(false)
let entryRequestId = 0

const entryId = computed(() => toRecordId(route.params.entryId))
const statusChip = computed(() => getJournalStatusChip(journalEntry.value?.display_status))
const canEdit = computed(() => canEditJournalDraft(journalEntry.value))
const canReverse = computed(() => canReverseJournalEntry(journalEntry.value))
const journalLinks = computed(() => buildJournalLinks(journalEntry.value))
const sourceLink = computed(() => buildSourceLinkTarget(journalEntry.value))
const serverTotals = computed(() => buildServerTotals(journalEntry.value))
const deleteMessage = computed(() => buildDeleteDraftMessage(journalEntry.value))
const infoRows = computed(() => {
  const shownEntry = journalEntry.value
  const infoList = [
    { label: 'Date', text: formatDisplayDate(shownEntry.entry_date) },
    { label: 'Description', text: shownEntry.description },
    { label: 'Reference', text: shownEntry.reference ?? NO_VALUE_LABEL },
    { label: 'Created by', text: shownEntry.created_by?.name ?? NO_VALUE_LABEL },
  ]
  if (shownEntry.posted_by) {
    infoList.push({ label: 'Posted by', text: `${shownEntry.posted_by.name} · ${formatTimestampDate(shownEntry.posted_at)}` })
  }
  if (shownEntry.reversal_reason) infoList.push({ label: 'Reversal reason', text: shownEntry.reversal_reason })
  return infoList
})

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadEntry() {
  const requestId = ++entryRequestId
  isNotFound.value = false
  if (entryId.value === null) {
    journalEntry.value = null
    isNotFound.value = true
    return
  }
  isLoading.value = true
  try {
    const entryResponse = await fetchJournalEntry(entryId.value)
    if (requestId !== entryRequestId) return
    journalEntry.value = entryResponse?.journal_entry ?? null
  } catch (error) {
    if (requestId !== entryRequestId) return
    journalEntry.value = null
    isNotFound.value = error.response?.status === HTTP_NOT_FOUND
    if (!isNotFound.value) toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === entryRequestId) isLoading.value = false
  }
}

function openDelete() {
  isDeleteOpen.value = true
}

function closeDelete() {
  if (isDeleting.value) return
  isDeleteOpen.value = false
}

async function confirmDelete() {
  if (isDeleting.value) return
  isDeleting.value = true
  try {
    await deleteJournalEntry(entryId.value)
    toast.success(DELETE_SUCCESS_MESSAGE)
    router.push({ name: JOURNAL_ENTRIES_ROUTE_NAME })
  } catch (error) {
    toastRequestError(error, DELETE_FAILED_MESSAGE)
    isDeleteOpen.value = false
    loadEntry()
  } finally {
    isDeleting.value = false
  }
}

function openReverse() {
  isReverseOpen.value = true
}

function closeReverse() {
  isReverseOpen.value = false
}

function handleReversed(reverseResponse) {
  isReverseOpen.value = false
  const reversalNumber = reverseResponse?.journal_entry?.number
  if (reverseResponse) toast.success(reversalNumber ? `Entry reversed as ${reversalNumber}.` : REVERSE_SUCCESS_MESSAGE)
  loadEntry()
}

watch(entryId, loadEntry, { immediate: true })
</script>

<template>
  <p v-if="isLoading && !journalEntry" class="text-sm text-ink-muted">{{ LOADING_TEXT }}</p>

  <section v-if="isNotFound" class="rounded-lg border border-line bg-surface px-4 py-12 text-center">
    <p class="text-sm font-bold text-ink">{{ NOT_FOUND_TEXT }}</p>
    <RouterLink :to="{ name: JOURNAL_ENTRIES_ROUTE_NAME }" :class="LINK_CLASS" class="mt-2 inline-block text-sm">
      {{ BACK_LABEL }}
    </RouterLink>
  </section>

  <div v-if="journalEntry" class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <RouterLink :to="{ name: JOURNAL_ENTRIES_ROUTE_NAME }" :class="LINK_CLASS" class="text-sm">{{ BACK_LABEL }}</RouterLink>
      <div class="flex gap-2">
        <template v-if="canEdit">
          <RouterLink
            :to="{ name: JOURNAL_ENTRY_EDIT_ROUTE_NAME, params: { entryId: journalEntry.id } }"
            :class="SECONDARY_BUTTON_CLASS"
          >
            Edit
          </RouterLink>
          <button type="button" :class="DESTRUCTIVE_BUTTON_CLASS" @click="openDelete">Delete</button>
        </template>
        <button v-if="canReverse" type="button" :class="SECONDARY_BUTTON_CLASS" @click="openReverse">Reverse</button>
      </div>
    </div>

    <section class="rounded-lg border border-line bg-surface">
      <div class="flex items-center gap-3 border-b border-line px-4 py-3">
        <h2 class="font-mono text-sm font-bold text-ink">{{ formatJournalNumber(journalEntry) }}</h2>
        <span v-if="statusChip" :class="[CHIP_CLASS, statusChip.colorClass]">{{ statusChip.label }}</span>
      </div>
      <dl class="grid gap-x-6 gap-y-2 px-4 py-3 text-sm sm:grid-cols-2">
        <div v-for="infoRow in infoRows" :key="infoRow.label">
          <dt class="text-xs font-semibold uppercase tracking-wider text-ink-muted">{{ infoRow.label }}</dt>
          <dd class="text-ink">{{ infoRow.text }}</dd>
        </div>
        <div>
          <dt class="text-xs font-semibold uppercase tracking-wider text-ink-muted">Source</dt>
          <dd class="flex flex-wrap items-center gap-2">
            <JournalSourceBadge :source="journalEntry.source ?? ''" />
            <RouterLink v-if="sourceLink" :to="sourceLink.to" :class="LINK_CLASS" class="text-sm">
              {{ sourceLink.label }}
            </RouterLink>
          </dd>
        </div>
        <div v-for="journalLink in journalLinks" :key="journalLink.label">
          <dt class="text-xs font-semibold uppercase tracking-wider text-ink-muted">{{ journalLink.label }}</dt>
          <dd>
            <RouterLink
              :to="{ name: JOURNAL_ENTRY_DETAIL_ROUTE_NAME, params: { entryId: journalLink.entryId } }"
              :class="LINK_CLASS"
              class="font-mono text-xs"
            >
              {{ journalLink.number }}
            </RouterLink>
          </dd>
        </div>
      </dl>
    </section>

    <section class="rounded-lg border border-line bg-surface">
      <div class="border-b border-line px-4 py-3">
        <h2 class="text-sm font-bold text-ink">Lines</h2>
      </div>
      <DataTable :columns="JOURNAL_LINE_COLUMNS" :rows="journalEntry.lines" :row-key="LINE_ROW_KEY" :empty-text="LINES_EMPTY_TEXT">
        <template #cell-account="{ row }">
          <span class="font-mono text-xs">{{ row.account.code }}</span>
          {{ row.account.name }}
        </template>
        <template #cell-memo="{ row }">{{ row.memo ?? NO_VALUE_LABEL }}</template>
        <template #cell-debit="{ row }">
          <span class="block text-right tabular-nums">{{ formatLedgerCell(row.debit) }}</span>
        </template>
        <template #cell-credit="{ row }">
          <span class="block text-right tabular-nums">{{ formatLedgerCell(row.credit) }}</span>
        </template>
      </DataTable>
      <div class="border-t border-line px-4 py-3">
        <JournalEntryTotals :line-totals="serverTotals" />
      </div>
    </section>
  </div>

  <ConfirmDialog
    :is-open="isDeleteOpen"
    :title="DELETE_TITLE"
    :message="deleteMessage"
    confirm-label="Delete"
    is-destructive
    :is-loading="isDeleting"
    @confirm="confirmDelete"
    @cancel="closeDelete"
  />
  <JournalEntryReverseModalView
    :is-open="isReverseOpen"
    :journal-entry="journalEntry"
    @close="closeReverse"
    @reversed="handleReversed"
  />
</template>
