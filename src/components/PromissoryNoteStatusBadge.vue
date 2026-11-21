<script setup>
import { computed } from 'vue'
import { getNoteStatusChip } from '@/utils/paymentHoldDisplay.js'

const CHIP_CLASS = 'rounded-full px-2.5 py-0.5 text-xs font-bold'

const props = defineProps({
  status: { type: String, required: true },
})

const chip = computed(() => getNoteStatusChip(props.status))
</script>

<template>
  <span :class="[CHIP_CLASS, chip.colorClass]">{{ chip.label }}</span>
</template>
