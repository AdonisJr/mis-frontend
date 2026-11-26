<script setup>
import { computed } from 'vue'
import { getJournalSourceChip } from '@/utils/journalEntryDisplay.js'

const CHIP_CLASS = 'rounded-full px-2.5 py-0.5 text-xs font-bold'

const props = defineProps({
  source: { type: String, default: '' },
})

const sourceChip = computed(() => getJournalSourceChip(props.source))
</script>

<template>
  <span v-if="sourceChip" :class="[CHIP_CLASS, sourceChip.colorClass]">{{ sourceChip.label }}</span>
</template>
