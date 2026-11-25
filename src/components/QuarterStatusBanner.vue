<script setup>
import { TriangleAlert } from '@lucide/vue'

const CHIP_CLASS = 'rounded-full px-2.5 py-0.5 text-xs font-bold'

defineProps({
  statusInfo: { type: Object, required: true },
  emptyComponentText: { type: String, default: '' },
})
</script>

<template>
  <div class="mb-3 space-y-1.5">
    <p class="flex flex-wrap items-center gap-2 text-sm text-ink">
      <span :class="[CHIP_CLASS, statusInfo.chipClass]">{{ statusInfo.label }}</span>
      <span>{{ statusInfo.text }}</span>
    </p>
    <p v-if="emptyComponentText" class="flex items-center gap-1.5 text-sm text-amber-800">
      <TriangleAlert :size="16" aria-hidden="true" />
      {{ emptyComponentText }}
    </p>
  </div>
</template>
