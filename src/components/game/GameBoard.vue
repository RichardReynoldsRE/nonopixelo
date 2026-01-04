<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useTutorialStore } from '@/stores/tutorialStore'
import Cell from './Cell.vue'

const gameStore = useGameStore()
const settingsStore = useSettingsStore()
const tutorialStore = useTutorialStore()

// Get tutorial highlight row
const tutorialHighlightRow = computed(() => {
  if (!tutorialStore.isActive) return null
  const step = tutorialStore.currentStep
  if (step?.action === 'fill-row' && step.requiredRow !== undefined) {
    return step.requiredRow
  }
  return null
})

// Check if row clues should be highlighted
const highlightRowClues = computed(() => {
  if (!tutorialStore.isActive) return false
  return tutorialStore.currentStep?.target?.type === 'row-clues'
})

// Check if column clues should be highlighted
const highlightColClues = computed(() => {
  if (!tutorialStore.isActive) return false
  return tutorialStore.currentStep?.target?.type === 'col-clues'
})

const boardRef = ref(null)
const containerRef = ref(null)
const scale = ref(1)

// Drag state
const isDragging = ref(false)
const dragAction = ref(null) // 'fill' or 'mark'
const processedCells = ref(new Set())
const lastDragEndTime = ref(0) // Prevent double-tap issues
const isUsingTouch = ref(false) // Track if user is using touch

// Calculate cell size based on grid size
const cellSize = computed(() => {
  const size = gameStore.gridSize
  if (size <= 5) return 44
  if (size <= 10) return 36
  if (size <= 15) return 28
  return 24
})

// Grid CSS variables
const gridStyle = computed(() => ({
  '--grid-size': gameStore.gridSize,
  '--cell-size': `${cellSize.value}px`,
  transform: `scale(${scale.value})`
}))

// Estimate board dimensions for scaling
const estimatedWidth = computed(() => {
  const clueWidth = 60 // approximate
  const gridWidth = gameStore.gridSize * (cellSize.value + 2)
  return clueWidth + gridWidth + 8
})

const estimatedHeight = computed(() => {
  const clueHeight = 50 // approximate
  const gridHeight = gameStore.gridSize * (cellSize.value + 2)
  return clueHeight + gridHeight + 8
})

// Calculate scale to fit screen
function calculateScale() {
  if (!containerRef.value) return

  const container = containerRef.value
  const availableWidth = container.clientWidth - 32
  const availableHeight = container.clientHeight - 32

  const scaleX = availableWidth / estimatedWidth.value
  const scaleY = availableHeight / estimatedHeight.value

  scale.value = Math.min(scaleX, scaleY, 1.3)
}

// Get cell coordinates from a point on screen
function getCellFromPoint(clientX, clientY) {
  if (!boardRef.value) return null

  const boardRect = boardRef.value.getBoundingClientRect()
  const gridSize = gameStore.gridSize
  const gap = 2 * scale.value
  const padding = 3 * scale.value
  const scaledCellSize = cellSize.value * scale.value

  // Get all cells to find the actual grid area
  const cells = boardRef.value.querySelectorAll('.game-cell')
  if (cells.length === 0) return null

  // Find grid boundaries from first and last cell
  const firstCell = cells[0].getBoundingClientRect()
  const lastCell = cells[cells.length - 1].getBoundingClientRect()

  const gridLeft = firstCell.left
  const gridTop = firstCell.top
  const gridRight = lastCell.right
  const gridBottom = lastCell.bottom

  // Check if point is within grid
  if (clientX < gridLeft || clientX > gridRight ||
      clientY < gridTop || clientY > gridBottom) {
    return null
  }

  // Calculate cell position
  const cellWidth = (gridRight - gridLeft) / gridSize
  const cellHeight = (gridBottom - gridTop) / gridSize

  const col = Math.floor((clientX - gridLeft) / cellWidth)
  const row = Math.floor((clientY - gridTop) / cellHeight)

  // Bounds check
  if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
    return null
  }

  return { row, col }
}

// Process a cell during drag
function processDragCell(row, col) {
  const key = `${row}-${col}`
  if (processedCells.value.has(key)) return

  processedCells.value.add(key)

  // Just use the current tool - no switching needed
  // The dragAction is only used to ensure consistent behavior during a drag
  // if the user switches tools mid-drag (which shouldn't happen normally)
  gameStore.toggleCell(row, col)
}

// Drag event handlers
function handleDragStart(e) {
  // Detect if this is a touch event
  const isTouchEvent = e.type === 'touchstart'

  // If using touch, ignore mouse events that follow
  if (!isTouchEvent && isUsingTouch.value) {
    const now = Date.now()
    if (now - lastDragEndTime.value < 500) {
      return // Ignore mouse event shortly after touch
    }
    isUsingTouch.value = false // Reset after timeout
  }

  if (isTouchEvent) {
    isUsingTouch.value = true
  }

  const touch = e.touches ? e.touches[0] : e
  const cell = getCellFromPoint(touch.clientX, touch.clientY)

  if (cell) {
    isDragging.value = true
    processedCells.value = new Set()
    dragAction.value = gameStore.currentTool

    processDragCell(cell.row, cell.col)
  }
}

function handleDragMove(e) {
  if (!isDragging.value) return

  // Only prevent default if event is cancelable (avoid console warnings)
  if (e.cancelable) {
    e.preventDefault()
  }

  const touch = e.touches ? e.touches[0] : e
  const cell = getCellFromPoint(touch.clientX, touch.clientY)

  if (cell) {
    processDragCell(cell.row, cell.col)
  }
}

function handleDragEnd() {
  isDragging.value = false
  dragAction.value = null
  processedCells.value = new Set()
  lastDragEndTime.value = Date.now() // Track end time to prevent double events
}

// Right-click to mark (desktop)
function handleContextMenu(e) {
  e.preventDefault()
  const cell = getCellFromPoint(e.clientX, e.clientY)
  if (cell) {
    const prevTool = gameStore.currentTool
    gameStore.setTool('mark')
    gameStore.toggleCell(cell.row, cell.col)
    gameStore.setTool(prevTool)
  }
}

// Timer update
let timerInterval = null

onMounted(() => {
  timerInterval = setInterval(() => {
    gameStore.updateTime()
  }, 1000)

  calculateScale()
  window.addEventListener('resize', calculateScale)

  // Global drag end listeners (in case drag ends outside grid)
  window.addEventListener('mouseup', handleDragEnd)
  window.addEventListener('touchend', handleDragEnd)
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  window.removeEventListener('resize', calculateScale)
  window.removeEventListener('mouseup', handleDragEnd)
  window.removeEventListener('touchend', handleDragEnd)
})

// Recalculate scale when puzzle changes
watch(() => gameStore.currentPuzzle, () => {
  setTimeout(calculateScale, 10)
}, { immediate: true })
</script>

<template>
  <div ref="containerRef" class="w-full h-full flex items-center justify-center overflow-hidden p-4">
    <div
      v-if="gameStore.playerGrid.length > 0"
      ref="boardRef"
      class="game-grid"
      :style="gridStyle"
      @mousedown="handleDragStart"
      @mousemove="handleDragMove"
      @touchstart="handleDragStart"
      @touchmove="handleDragMove"
      @contextmenu="handleContextMenu"
    >
      <!-- Empty corner cell -->
      <div class="grid-corner"></div>

      <!-- Column clues - one per column -->
      <div
        v-for="(clues, colIndex) in gameStore.colClues"
        :key="`col-${colIndex}`"
        class="col-clue"
        :class="{
          'clue-completed': settingsStore.highlightCompleted && gameStore.isColCompleted[colIndex],
          'tutorial-highlight-clue': highlightColClues
        }"
      >
        <span v-for="(clue, i) in clues" :key="i" class="clue-num">{{ clue }}</span>
      </div>

      <!-- Rows: row clue + cells -->
      <template v-for="(row, rowIndex) in gameStore.playerGrid" :key="`row-${rowIndex}`">
        <!-- Row clue -->
        <div
          class="row-clue"
          :class="{
            'clue-completed': settingsStore.highlightCompleted && gameStore.isRowCompleted[rowIndex],
            'tutorial-highlight': tutorialHighlightRow === rowIndex,
            'tutorial-highlight-clue': highlightRowClues
          }"
        >
          <span v-for="(clue, i) in gameStore.rowClues[rowIndex]" :key="i" class="clue-num">{{ clue }}</span>
        </div>

        <!-- Cells for this row -->
        <Cell
          v-for="(cell, colIndex) in row"
          :key="`${rowIndex}-${colIndex}`"
          :state="cell"
          :highlight="tutorialHighlightRow === rowIndex"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.game-grid {
  display: grid;
  grid-template-columns: auto repeat(var(--grid-size), var(--cell-size));
  grid-template-rows: auto repeat(var(--grid-size), var(--cell-size));
  gap: 2px;
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
  padding: 3px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  transform-origin: center;
}

.grid-corner {
  /* Empty corner - sized by auto */
}

.col-clue {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding: 4px 2px 6px 2px;
  gap: 1px;
  background: transparent;
}

.row-clue {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 2px 8px 2px 6px;
  gap: 6px;
  background: transparent;
}

.clue-num {
  font-size: 0.75rem;
  font-weight: 700;
  color: #4b5563;
  line-height: 1.3;
  min-width: 0.8em;
  text-align: center;
}

.clue-completed .clue-num {
  color: #22d3ee;
  text-decoration: line-through;
  opacity: 0.7;
}

/* Tutorial highlight for target row */
.tutorial-highlight {
  background: rgba(6, 182, 212, 0.2);
  border-radius: 8px;
  animation: tutorial-pulse 1.5s ease-in-out infinite;
}

.tutorial-highlight .clue-num {
  color: #0891b2;
  font-weight: 800;
}

@keyframes tutorial-pulse {
  0%, 100% {
    background: rgba(6, 182, 212, 0.2);
    box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.4);
  }
  50% {
    background: rgba(6, 182, 212, 0.35);
    box-shadow: 0 0 8px 2px rgba(6, 182, 212, 0.3);
  }
}

/* Tutorial highlight for clue explanations */
.tutorial-highlight-clue {
  background: rgba(6, 182, 212, 0.15);
  border-radius: 6px;
  animation: clue-pulse 1.2s ease-in-out infinite;
}

.tutorial-highlight-clue .clue-num {
  color: #0891b2;
  font-weight: 800;
}

@keyframes clue-pulse {
  0%, 100% {
    background: rgba(6, 182, 212, 0.15);
  }
  50% {
    background: rgba(6, 182, 212, 0.3);
  }
}

</style>

<style>
/* Dark mode - unscoped to work with .dark on html */
.dark .game-grid {
  background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
}

.dark .clue-num {
  color: #cbd5e1;
}

.dark .clue-completed .clue-num {
  color: #22d3ee;
}

.dark .tutorial-highlight .clue-num {
  color: #22d3ee;
}
</style>
