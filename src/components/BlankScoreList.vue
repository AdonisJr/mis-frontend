<script setup>
const HEADING_TEXT = 'Blank scores count as 0:'
const NONE_TEXT = 'No blank scores.'

defineProps({
  lines: { type: Array, required: true },
})
</script>

<template>
  <div class="mt-3 text-sm text-ink">
    <template v-if="lines.length > 0">
      <p class="mb-1 font-semibold">{{ HEADING_TEXT }}</p>
      <ul class="max-h-60 list-disc overflow-y-auto pl-5">
        <li v-for="(blankLine, lineIndex) in lines" :key="lineIndex">{{ blankLine }}</li>
      </ul>
    </template>
    <p v-else class="text-ink-muted">{{ NONE_TEXT }}</p>
  </div>
</template>
