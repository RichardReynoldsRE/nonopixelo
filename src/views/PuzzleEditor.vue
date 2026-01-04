<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCreatorStore } from '@/stores/creatorStore'
import PixelCanvas from '@/components/creator/PixelCanvas.vue'
import ToolBar from '@/components/creator/ToolBar.vue'
import ColorPalette from '@/components/creator/ColorPalette.vue'

const props = defineProps({
  packId: String,
  puzzleId: String
})

const router = useRouter()
const creatorStore = useCreatorStore()

const puzzleName = ref('Untitled')
const showSaveModal = ref(false)
const showExportModal = ref(false)

const gridSizes = [5, 8, 10, 12, 15, 20]

onMounted(() => {
  creatorStore.loadFromLocalStorage()

  if (props.puzzleId) {
    // Load existing puzzle
    const pack = creatorStore.packs.find(p => p.id === props.packId)
    if (pack) {
      const puzzle = pack.puzzles.find(p => p.id === props.puzzleId)
      if (puzzle) {
        creatorStore.loadPuzzle(puzzle)
        puzzleName.value = puzzle.name
        return
      }
    }
  }

  // New puzzle
  creatorStore.initializeGrids(10)
})

function handleSave() {
  const puzzle = creatorStore.exportPuzzle()
  puzzle.name = puzzleName.value

  // Find or create pack
  let pack = creatorStore.packs.find(p => p.id === props.packId)
  if (!pack) {
    pack = creatorStore.createPack({ name: 'My Puzzles' })
  }

  // Update or add puzzle
  const existingIndex = pack.puzzles.findIndex(p => p.id === puzzle.id)
  if (existingIndex >= 0) {
    pack.puzzles[existingIndex] = puzzle
  } else {
    pack.puzzles.push(puzzle)
  }

  creatorStore.currentPuzzle = puzzle
  creatorStore.saveToLocalStorage()
  showSaveModal.value = true
  setTimeout(() => showSaveModal.value = false, 2000)
}

function handleExport() {
  const puzzle = creatorStore.exportPuzzle()
  puzzle.name = puzzleName.value

  const json = JSON.stringify(puzzle, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `${puzzleName.value.toLowerCase().replace(/\s+/g, '_')}.json`
  a.click()

  URL.revokeObjectURL(url)
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
  if (props.packId) {
    router.push(`/creator/pack/${props.packId}`)
  } else {
    router.push('/creator')
  }
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

      <input
        v-model="puzzleName"
        class="puzzle-name-input"
        placeholder="Puzzle name..."
      />

      <div class="header-actions">
        <button class="action-btn" @click="handleExport" title="Export JSON">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
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

      <!-- Right sidebar - Colors & Preview -->
      <aside class="sidebar sidebar-right">
        <ColorPalette />

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

    <!-- Save confirmation modal -->
    <div v-if="showSaveModal" class="save-toast">
      Puzzle saved!
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

.puzzle-name-input {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
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
