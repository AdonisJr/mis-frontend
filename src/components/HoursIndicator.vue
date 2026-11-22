<script setup>
import { computed } from 'vue'
import { buildHoursText, getHoursStatusChip } from '@/utils/scheduleDisplay.js'

const props = defineProps({
  scheduleRow: { type: Object, required: true },
})

const hoursText = computed(() => buildHoursText(props.scheduleRow))
const statusChip = computed(() => getHoursStatusChip(props.scheduleRow.class?.hours_status))
</script>

<template>
  <span class="inline-flex flex-wrap items-center gap-2">
    <span class="text-sm tabular-nums">{{ hoursText }}</span>
    <span class="rounded-full px-2.5 py-0.5 text-xs font-bold" :class="statusChip.colorClass">{{ statusChip.label }}</span>
  </span>
</template>
