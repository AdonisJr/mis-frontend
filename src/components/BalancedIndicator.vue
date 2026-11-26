<script setup>
import { computed } from 'vue'
import { getBalancedChip } from '@/utils/reportDisplay.js'

const props = defineProps({
  isBalanced: { type: Boolean, required: true },
})

const balancedChip = computed(() => getBalancedChip(props.isBalanced))
</script>

<template>
  <span
    class="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold"
    :class="balancedChip.colorClass"
    role="status"
  >
    {{ balancedChip.label }}
  </span>
</template>
