<script setup>
const SCHEDULE_LABEL = 'Schedule'

defineProps({
  title: { type: String, required: true },
  items: { type: Array, required: true },
  printItems: { type: Array, required: true },
  scheduleLines: { type: Array, required: true },
})
</script>

<template>
  <header class="mb-4 border-b border-line pb-3">
    <h2 class="mb-3 text-lg font-bold text-ink">{{ title }}</h2>
    <dl class="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2 print:hidden">
      <div v-for="item in items" :key="item.key" class="flex gap-2">
        <dt class="w-28 shrink-0 text-ink-muted">{{ item.label }}</dt>
        <dd class="min-w-0 font-semibold text-ink">{{ item.text }}</dd>
      </div>
      <div class="flex gap-2">
        <dt class="w-28 shrink-0 text-ink-muted">{{ SCHEDULE_LABEL }}</dt>
        <dd class="min-w-0 font-semibold text-ink">
          <p v-for="(scheduleLine, lineIndex) in scheduleLines" :key="lineIndex" class="tabular-nums">
            {{ scheduleLine }}
          </p>
        </dd>
      </div>
    </dl>
    <dl class="hidden grid-cols-1 gap-x-6 gap-y-1 text-sm print:grid print:grid-cols-2">
      <div v-for="printItem in printItems" :key="printItem.key" class="flex gap-2">
        <dt class="w-24 shrink-0 text-ink-muted">{{ printItem.label }}</dt>
        <dd class="min-w-0 font-semibold text-ink">{{ printItem.text }}</dd>
      </div>
    </dl>
  </header>
</template>
