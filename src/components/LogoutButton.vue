<script setup>
defineProps({
  isLoading: { type: Boolean, default: false },
})

const emit = defineEmits(['logout'])
</script>

<template>
  <button
    type="button"
    class="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
    :disabled="isLoading"
    @click="emit('logout')"
  >
    {{ isLoading ? 'Logging out…' : 'Log out' }}
  </button>
</template>
