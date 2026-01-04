<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useCreatorStore } from '@/stores/creatorStore'

const creatorStore = useCreatorStore()

const canvasRef = ref(null)
const isReady = ref(false)
const containerRef = ref(null)
const isDrawing = ref(false)
const lastCell = ref(null)
const drawStartCell = ref(null)

// Canvas dimensions
const cellSize = computed(() => {
  const base = 30
  return Math.floor(base * (creatorStore.zoom / 100))
})

const canvasWidth = computed(() => creatorStore.gridSize * cellSize.value)
const canvasHeight = computed(() => creatorStore.gridSize * cellSize.value)

// Get color for a cell value
function getCellColor(value, isRevealLayer) {
  if (value === 0) return '#ffffff'
  if (!isRevealLayer) return '#06b6d4' // Solution layer - always cyan
  // Reveal layer - use palette
  const paletteIndex = value - 1
  if (paletteIndex >= 0 && paletteIndex < creatorStore.palette.length) {
    return creatorStore.palette[paletteIndex]
  }
  return '#06b6d4'
}

// Draw the canvas
function draw() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const size = cellSize.value
  const gridSize = creatorStore.gridSize
  const isReveal = creatorStore.currentLayer === 'reveal'
  const grid = isReveal ? creatorStore.revealGrid : creatorStore.solutionGrid

  // Ensure we have valid grid data
  if (!grid || !grid.length || grid.length !== gridSize) {
    // Draw empty grid as fallback
    ctx.fillStyle = '#f3f4f6'
    ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)

    // Still draw the grid lines
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const x = c * size
        const y = r * size
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(x + 1, y + 1, size - 2, size - 2)
        ctx.strokeStyle = '#d1d5db'
        ctx.lineWidth = 1
        ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1)
      }
    }
    return
  }

  // Clear canvas
  ctx.fillStyle = '#f3f4f6'
  ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)

  // Draw cells
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const value = grid[r]?.[c] ?? 0
      const x = c * size
      const y = r * size

      // Cell fill
      ctx.fillStyle = getCellColor(value, isReveal)
      ctx.fillRect(x + 1, y + 1, size - 2, size - 2)

      // Cell border
      ctx.strokeStyle = '#d1d5db'
      ctx.lineWidth = 1
      ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1)
    }
  }

  // Draw grid lines for every 5 cells
  ctx.strokeStyle = '#9ca3af'
  ctx.lineWidth = 2
  for (let i = 0; i <= gridSize; i += 5) {
    // Vertical line
    ctx.beginPath()
    ctx.moveTo(i * size, 0)
    ctx.lineTo(i * size, canvasHeight.value)
    ctx.stroke()

    // Horizontal line
    ctx.beginPath()
    ctx.moveTo(0, i * size)
    ctx.lineTo(canvasWidth.value, i * size)
    ctx.stroke()
  }

  isReady.value = true
}

// Get cell coordinates from mouse/touch event
function getCellFromEvent(e) {
  const canvas = canvasRef.value
  if (!canvas) return null

  const rect = canvas.getBoundingClientRect()
  const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left
  const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top

  const col = Math.floor(x / cellSize.value)
  const row = Math.floor(y / cellSize.value)

  if (row >= 0 && row < creatorStore.gridSize && col >= 0 && col < creatorStore.gridSize) {
    return { row, col }
  }
  return null
}

// Get value to draw based on tool
function getDrawValue() {
  if (creatorStore.currentTool === 'eraser') return 0
  if (creatorStore.currentLayer === 'solution') return 1
  return creatorStore.currentColorIndex
}

// Handle drawing
function handlePointerDown(e) {
  const cell = getCellFromEvent(e)
  if (!cell) return

  isDrawing.value = true
  lastCell.value = cell
  drawStartCell.value = cell
  creatorStore.saveState()

  const tool = creatorStore.currentTool
  const value = getDrawValue()

  if (tool === 'pencil' || tool === 'eraser') {
    creatorStore.setCell(cell.row, cell.col, value)
    draw()
  } else if (tool === 'fill') {
    creatorStore.floodFill(cell.row, cell.col, value)
    draw()
    isDrawing.value = false
  } else if (tool === 'eyedropper') {
    const grid = creatorStore.currentLayer === 'reveal'
      ? creatorStore.revealGrid
      : creatorStore.solutionGrid
    const pickedValue = grid[cell.row][cell.col]
    if (pickedValue > 0) {
      creatorStore.currentColorIndex = pickedValue
    }
    isDrawing.value = false
  }
}

function handlePointerMove(e) {
  if (!isDrawing.value) return

  const cell = getCellFromEvent(e)
  if (!cell) return

  const tool = creatorStore.currentTool
  const value = getDrawValue()

  if (tool === 'pencil' || tool === 'eraser') {
    // Draw line from last cell to current cell for smooth drawing
    if (lastCell.value) {
      creatorStore.drawLine(lastCell.value.row, lastCell.value.col, cell.row, cell.col, value)
    }
    lastCell.value = cell
    draw()
  }
  // Line and rect tools preview would go here (not implemented for simplicity)
}

function handlePointerUp(e) {
  if (!isDrawing.value) return

  const cell = getCellFromEvent(e) || lastCell.value
  const tool = creatorStore.currentTool
  const value = getDrawValue()

  if (tool === 'line' && drawStartCell.value && cell) {
    creatorStore.drawLine(drawStartCell.value.row, drawStartCell.value.col, cell.row, cell.col, value)
    draw()
  } else if (tool === 'rect' && drawStartCell.value && cell) {
    creatorStore.drawRect(drawStartCell.value.row, drawStartCell.value.col, cell.row, cell.col, value, false)
    draw()
  } else if (tool === 'rectFilled' && drawStartCell.value && cell) {
    creatorStore.drawRect(drawStartCell.value.row, drawStartCell.value.col, cell.row, cell.col, value, true)
    draw()
  }

  isDrawing.value = false
  lastCell.value = null
  drawStartCell.value = null
}

function handlePointerLeave() {
  if (isDrawing.value) {
    handlePointerUp({})
  }
}

// Prevent context menu
function handleContextMenu(e) {
  e.preventDefault()
}

// Watch for changes that require redraw
watch([
  () => creatorStore.solutionGrid,
  () => creatorStore.revealGrid,
  () => creatorStore.currentLayer,
  () => creatorStore.palette,
  () => creatorStore.zoom,
  () => creatorStore.gridSize
], () => {
  nextTick(() => draw())
}, { deep: true, immediate: true })

onMounted(async () => {
  window.addEventListener('pointerup', handlePointerUp)

  // Wait for next tick to ensure canvas is in DOM
  await nextTick()
  draw()

  // Also try again after a short delay in case data is still loading
  setTimeout(() => {
    if (!isReady.value) {
      draw()
    }
  }, 50)

  // And once more for safety
  setTimeout(() => {
    draw()
  }, 150)
})

onUnmounted(() => {
  window.removeEventListener('pointerup', handlePointerUp)
})
</script>

<template>
  <div ref="containerRef" class="canvas-container">
    <canvas
      ref="canvasRef"
      :width="canvasWidth"
      :height="canvasHeight"
      class="pixel-canvas"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointerleave="handlePointerLeave"
      @contextmenu="handleContextMenu"
    />
  </div>
</template>

<style scoped>
.canvas-container {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  background: #e5e7eb;
  border-radius: 12px;
  padding: 16px;
}

.pixel-canvas {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  cursor: crosshair;
  touch-action: none;
}
</style>
