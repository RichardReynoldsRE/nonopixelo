<script setup>
import { computed } from 'vue'

const props = defineProps({
  solution: {
    type: Array,
    required: true
  },
  // Single color fallback for puzzles without palette
  color: {
    type: String,
    default: '#06B6D4'
  },
  // Multi-color palette: palette[0] is for value 1, palette[1] for value 2, etc.
  palette: {
    type: Array,
    default: null
  },
  size: {
    type: Number,
    default: 200
  },
  // Whether to animate the reveal
  animated: {
    type: Boolean,
    default: true
  }
})

const gridSize = computed(() => props.solution.length)
const cellSize = computed(() => Math.floor(props.size / gridSize.value))

// Get color for a cell value
function getCellColor(value) {
  if (value === 0) return '#F5F5F5' // Off-white/light gray for empty cells

  // If we have a palette, use it (value 1 = palette[0], value 2 = palette[1], etc.)
  if (props.palette && props.palette.length > 0) {
    const paletteIndex = value - 1
    if (paletteIndex >= 0 && paletteIndex < props.palette.length) {
      return props.palette[paletteIndex]
    }
  }

  // Fallback to single color
  return props.color
}
</script>

<template>
  <div
    class="inline-block rounded-xl overflow-hidden shadow-lg bg-white p-2"
    :style="{ width: `${size + 16}px` }"
  >
    <div
      class="grid mx-auto"
      :style="{
        gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
        width: `${cellSize * gridSize}px`
      }"
    >
      <div
        v-for="(row, rowIndex) in solution"
        v-bind:key="rowIndex"
        class="contents"
      >
        <div
          v-for="(cell, colIndex) in row"
          :key="`${rowIndex}-${colIndex}`"
          :class="['pixel-cell', { 'pixel-cell--animated': animated }]"
          :style="{
            backgroundColor: getCellColor(cell),
            animationDelay: animated ? `${(rowIndex * gridSize + colIndex) * 15}ms` : undefined
          }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.pixel-cell {
  opacity: 1;
}

.pixel-cell--animated {
  animation: pixelReveal 0.3s ease-out forwards;
  opacity: 0;
  transform: scale(0);
}

@keyframes pixelReveal {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
