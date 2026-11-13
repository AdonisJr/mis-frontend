<script setup>
defineProps({
  result: { type: Object, required: true },
})
</script>

<template>
  <div class="space-y-2">
    <p class="text-sm font-semibold text-ink">{{ result.copiedText }}</p>
    <div v-if="result.skipped.length > 0">
      <h3 class="text-xs uppercase tracking-wider text-ink-muted">Skipped</h3>
      <ul class="mt-1 space-y-1 text-sm text-ink">
        <li v-for="(skippedStudent, skippedIndex) in result.skipped" :key="skippedStudent.id ?? skippedIndex">
          {{ skippedStudent.studentName }} — {{ skippedStudent.reason }}
        </li>
      </ul>
    </div>
  </div>
</template>
