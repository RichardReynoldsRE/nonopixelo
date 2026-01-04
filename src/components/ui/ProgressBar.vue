<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: {
    type: Number,
    default: 0
  },
  max: {
    type: Number,
    default: 100
  },
  showLabel: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: 'primary'
  }
})

const percentage = computed(() => {
  return Math.min(100, Math.max(0, (props.value / props.max) * 100))
})

const colorClass = computed(() => {
  switch (props.color) {
    case 'coral': return 'from-coral-400 to-coral-500'
    case 'green': return 'from-green-400 to-green-500'
    default: return 'from-primary-400 to-primary-500'
  }
})
</script>

<template>
  <div class="w-full">
    <div class="flex justify-between mb-1" v-if="showLabel">
      <span class="text-sm text-gray-600 dark:text-gray-400 font-medium">{{ value }} / {{ max }}</span>
      <span class="text-sm text-gray-500 dark:text-gray-500">{{ Math.round(percentage) }}%</span>
    </div>
    <div class="h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <div
        class="h-full bg-gradient-to-r rounded-full transition-all duration-500 ease-out"
        :class="colorClass"
        :style="{ width: `${percentage}%` }"
      />
    </div>
  </div>
</template>
