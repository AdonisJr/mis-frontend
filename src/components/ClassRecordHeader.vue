<script setup>
const QUARTER_LABEL = 'Quarter'
const QUARTER_SELECT_ID = 'class-record-quarter'
const SELECT_CLASS =
  'rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

defineProps({
  title: { type: String, required: true },
  items: { type: Array, required: true },
  printItems: { type: Array, required: true },
  quarterOptions: { type: Array, required: true },
  quarter: { type: String, default: '' },
  isQuarterDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:quarter'])
</script>

<template>
  <header class="mb-4 border-b border-line pb-3">
    <h2 class="mb-3 text-lg font-bold text-ink">{{ title }}</h2>
    <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 print:hidden">
      <dl class="grid min-w-0 grow grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div v-for="item in items" :key="item.key" class="flex gap-2">
          <dt class="w-28 shrink-0 text-ink-muted">{{ item.label }}</dt>
          <dd class="min-w-0 font-semibold text-ink">{{ item.text }}</dd>
        </div>
      </dl>
      <div>
        <label :for="QUARTER_SELECT_ID" class="mb-1 block text-sm font-semibold text-ink">{{ QUARTER_LABEL }}</label>
        <select
          :id="QUARTER_SELECT_ID"
          :value="quarter"
          :class="SELECT_CLASS"
          :disabled="isQuarterDisabled || quarterOptions.length === 0"
          @change="emit('update:quarter', $event.target.value)"
        >
          <option v-for="quarterOption in quarterOptions" :key="quarterOption.value" :value="quarterOption.value">
            {{ quarterOption.label }}
          </option>
        </select>
      </div>
    </div>
    <dl class="hidden grid-cols-1 gap-x-6 gap-y-1 text-sm print:grid print:grid-cols-3">
      <div v-for="printItem in printItems" :key="printItem.key" class="flex gap-2">
        <dt class="w-24 shrink-0 text-ink-muted">{{ printItem.label }}</dt>
        <dd class="min-w-0 font-semibold text-ink">{{ printItem.text }}</dd>
      </div>
    </dl>
  </header>
</template>
