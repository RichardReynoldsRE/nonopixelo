<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCreatorStore } from '@/stores/creatorStore'
import { getScheduledPuzzle, getDailyOverride, saveDailyOverride } from '@/data/dailyPuzzles'
import PixelCanvas from '@/components/creator/PixelCanvas.vue'
import ToolBar from '@/components/creator/ToolBar.vue'
import ColorPalette from '@/components/creator/ColorPalette.vue'

const props = defineProps({
  date: String
})

const router = useRouter()
const creatorStore = useCreatorStore()

const puzzleName = ref('Daily Puzzle')
const puzzleColor = ref('#06B6D4')
const showSaveModal = ref(false)
const showExportModal = ref(false)
const exportCode = ref('')

const gridSizes = [5, 8, 10, 12, 15]

const formattedDate = computed(() => {
  const date = new Date(props.date + 'T12:00:00')
  return date.toLocaleDateString('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
})

const dayOfWeek = computed(() => {
  return new Date(props.date + 'T12:00:00').getDay()
})

const isWeekend = computed(() => dayOfWeek.value === 0 || dayOfWeek.value === 6)

onMounted(() => {
  // First check for localStorage override
  const override = getDailyOverride(props.date)
  if (override) {
    puzzleName.value = override.name
    puzzleColor.value = override.color
    creatorStore.loadPuzzle({
      id: `daily_${props.date}`,
      name: override.name,
      size: override.size,
      solution: override.solution,
      palette: [override.color],
      revealImage: override.solution
    })
    return
  }

  // Then check for scheduled puzzle (from static file)
  const scheduled = getScheduledPuzzle(props.date)
  if (scheduled) {
    puzzleName.value = scheduled.name
    puzzleColor.value = scheduled.color
    creatorStore.loadPuzzle({
      id: `daily_${props.date}`,
      name: scheduled.name,
      size: scheduled.size,
      solution: scheduled.solution,
      palette: [scheduled.color],
      revealImage: scheduled.solution
    })
    return
  }

  // New puzzle - use default size based on day
  const defaultSize = isWeekend.value ? 5 : 10
  creatorStore.initializeGrids(defaultSize)
  puzzleName.value = 'Daily Puzzle'
  puzzleColor.value = '#06B6D4'
  creatorStore.palette = [puzzleColor.value]
})

function handleSave() {
  const puzzleData = {
    name: puzzleName.value,
    size: creatorStore.gridSize,
    color: puzzleColor.value,
    solution: JSON.parse(JSON.stringify(creatorStore.solutionGrid))
  }

  saveDailyOverride(props.date, puzzleData)
  showSaveModal.value = true
  setTimeout(() => showSaveModal.value = false, 2000)
}

function generateExportCode() {
  const solution = creatorStore.solutionGrid
  const solutionStr = solution.map(row =>
    `      [${row.join(', ')}]`
  ).join(',\n')

  exportCode.value = `  // ${props.date} - ${puzzleName.value}
  '${props.date}': {
    name: '${puzzleName.value}',
    size: ${creatorStore.gridSize},
    color: '${puzzleColor.value}',
    solution: [
${solutionStr}
    ]
  },`

  showExportModal.value = true
}

function copyExportCode() {
  navigator.clipboard.writeText(exportCode.value)
}

function handleGridSizeChange(e) {
  const newSize = parseInt(e.target.value)
  if (newSize !== creatorStore.gridSize) {
    if (confirm('Changing grid size may clip existing artwork. Continue?')) {
      creatorStore.resizeGrid(newSize)
    }
  }
}

function goBack() {
  router.push('/creator/daily')
}
</script>

<template>
  <div class="editor-view force-light">
    <!-- Header -->
    <header class="editor-header">
      <button class="back-btn" @click="goBack">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      <div class="header-info">
        <span class="date-label">{{ formattedDate }}</span>
        <input
          v-model="puzzleName"
          class="puzzle-name-input"
          placeholder="Puzzle name..."
        />
      </div>

      <div class="header-actions">
        <div class="color-picker-wrapper">
          <input
            type="color"
            v-model="puzzleColor"
            class="color-picker"
            title="Puzzle color"
          />
        </div>
        <button class="action-btn" @click="generateExportCode" title="Export Code">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
          </svg>
        </button>
        <button class="save-btn" @click="handleSave">
          Save
        </button>
      </div>
    </header>

    <!-- Main content -->
    <div class="editor-content">
      <!-- Left sidebar - Tools -->
      <aside class="sidebar sidebar-left">
        <ToolBar />
      </aside>

      <!-- Center - Canvas -->
      <main class="canvas-area">
        <PixelCanvas />

        <!-- Bottom controls -->
        <div class="canvas-controls">
          <div class="control-group">
            <label>Size:</label>
            <select
              :value="creatorStore.gridSize"
              @change="handleGridSizeChange"
              class="size-select"
            >
              <option v-for="size in gridSizes" :key="size" :value="size">
                {{ size }}x{{ size }}
              </option>
            </select>
          </div>

          <div class="control-group">
            <label>Zoom:</label>
            <input
              type="range"
              :value="creatorStore.zoom"
              @input="creatorStore.zoom = $event.target.value"
              min="50"
              max="200"
              step="10"
              class="zoom-slider"
            />
            <span class="zoom-value">{{ creatorStore.zoom }}%</span>
          </div>

          <div class="stats">
            <span>{{ creatorStore.filledCellCount }}/{{ creatorStore.totalCells }}</span>
            <span class="stat-label">({{ creatorStore.fillPercentage }}% filled)</span>
          </div>
        </div>
      </main>

      <!-- Right sidebar - Info -->
      <aside class="sidebar sidebar-right">
        <ColorPalette />

        <!-- Day info -->
        <div class="day-info-panel">
          <div class="section-title">Day Info</div>
          <div class="info-item">
            <span class="info-label">Date:</span>
            <span>{{ props.date }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Day:</span>
            <span>{{ ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek] }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Suggested:</span>
            <span>{{ isWeekend ? '5x5 (Weekend)' : '10x10 (Weekday)' }}</span>
          </div>
        </div>

        <!-- Clues preview -->
        <div class="clues-preview">
          <div class="section-title">Row Clues</div>
          <div class="clues-list">
            <div v-for="(clue, i) in creatorStore.rowClues.slice(0, 5)" :key="i" class="clue-row">
              {{ clue.join(' ') }}
            </div>
            <div v-if="creatorStore.rowClues.length > 5" class="clue-row">...</div>
          </div>

          <div class="section-title mt-3">Col Clues</div>
          <div class="clues-list horizontal">
            <div v-for="(clue, i) in creatorStore.colClues.slice(0, 5)" :key="i" class="clue-col">
              <span v-for="(num, j) in clue" :key="j">{{ num }}</span>
            </div>
            <div v-if="creatorStore.colClues.length > 5" class="clue-col">...</div>
          </div>
        </div>
      </aside>
    </div>

    <!-- Save confirmation toast -->
    <div v-if="showSaveModal" class="save-toast">
      Puzzle saved!
    </div>

    <!-- Export modal -->
    <div v-if="showExportModal" class="export-modal-overlay" @click="showExportModal = false">
      <div class="export-modal" @click.stop>
        <h2>Export Code</h2>
        <p class="export-hint">Copy this code and paste it into <code>dailyPuzzles.js</code></p>
        <pre class="export-code">{{ exportCode }}</pre>
        <div class="export-actions">
          <button class="copy-btn" @click="copyExportCode">
            Copy to Clipboard
          </button>
          <button class="close-btn" @click="showExportModal = false">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-view {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #f9fafb;
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.back-btn {
  padding: 8px;
  border-radius: 8px;
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.back-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.puzzle-name-input {
  padding: 4px 8px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.puzzle-name-input:focus {
  outline: none;
  border-color: #06b6d4;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-picker-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e5e7eb;
}

.color-picker {
  width: 50px;
  height: 50px;
  margin: -7px;
  cursor: pointer;
  border: none;
}

.action-btn {
  padding: 8px 12px;
  border-radius: 8px;
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.save-btn {
  padding: 8px 20px;
  border-radius: 8px;
  background: #06b6d4;
  color: white;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
}

.save-btn:hover {
  background: #0891b2;
}

.editor-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 200px;
  background: white;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
}

.sidebar-right {
  border-right: none;
  border-left: 1px solid #e5e7eb;
}

.canvas-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.canvas-controls {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 12px 16px;
  background: white;
  border-top: 1px solid #e5e7eb;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
}

.size-select {
  padding: 6px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.zoom-slider {
  width: 100px;
}

.zoom-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  min-width: 45px;
}

.stats {
  margin-left: auto;
  font-size: 0.875rem;
  color: #6b7280;
}

.stat-label {
  margin-left: 4px;
}

.day-info-panel {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #374151;
  padding: 4px 0;
}

.info-label {
  color: #6b7280;
}

.clues-preview {
  padding: 12px;
  border-top: 1px solid #e5e7eb;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.clues-list {
  font-size: 0.75rem;
  font-family: monospace;
  color: #374151;
}

.clue-row {
  padding: 2px 0;
}

.clues-list.horizontal {
  display: flex;
  gap: 8px;
}

.clue-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.mt-3 {
  margin-top: 12px;
}

.save-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  background: #22c55e;
  color: white;
  font-weight: 600;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.15);
  animation: slideUp 0.3s ease;
  z-index: 200;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* Export modal */
.export-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
}

.export-modal {
  background: white;
  border-radius: 16px;
  padding: 24px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.export-modal h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #374151;
  margin-bottom: 8px;
}

.export-hint {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 16px;
}

.export-hint code {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.export-code {
  background: #1e293b;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-family: monospace;
  overflow-x: auto;
  white-space: pre;
  margin-bottom: 16px;
}

.export-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.copy-btn {
  padding: 8px 16px;
  background: #06b6d4;
  color: white;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.copy-btn:hover {
  background: #0891b2;
}

.close-btn {
  padding: 8px 16px;
  background: #f3f4f6;
  color: #374151;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.close-btn:hover {
  background: #e5e7eb;
}

/* Responsive */
@media (max-width: 768px) {
  .editor-content {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
    border: none;
    border-bottom: 1px solid #e5e7eb;
  }

  .sidebar-left {
    order: 2;
    display: flex;
    padding: 8px;
  }

  .sidebar-right {
    order: 3;
    border-top: 1px solid #e5e7eb;
  }

  .canvas-area {
    order: 1;
  }
}
</style>
