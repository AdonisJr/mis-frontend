<script setup>
defineProps({
  row: { type: Object, required: true },
  columns: { type: Array, required: true },
  hasActions: { type: Boolean, default: false },
})
</script>

<template>
  <tr class="border-t border-line">
    <td v-for="column in columns" :key="column.key" class="px-4 py-3 align-middle text-ink">
      <slot name="cell" :column="column" />
    </td>
    <td v-if="hasActions" class="px-4 py-3 text-right"><slot name="actions" /></td>
  </tr>
</template>
