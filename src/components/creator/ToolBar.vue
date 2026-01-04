<script setup>
import { useCreatorStore } from '@/stores/creatorStore'

const creatorStore = useCreatorStore()

const tools = [
  { id: 'pencil', icon: 'pencil', label: 'Pencil' },
  { id: 'eraser', icon: 'eraser', label: 'Eraser' },
  { id: 'fill', icon: 'fill', label: 'Fill' },
  { id: 'line', icon: 'line', label: 'Line' },
  { id: 'rect', icon: 'rect', label: 'Rectangle' },
  { id: 'rectFilled', icon: 'rectFilled', label: 'Filled Rect' },
  { id: 'eyedropper', icon: 'eyedropper', label: 'Pick Color' }
]

function selectTool(toolId) {
  creatorStore.currentTool = toolId
}
</script>

<template>
  <div class="toolbar">
    <div class="section-title">Tools</div>

    <div class="tools-grid">
      <button
        v-for="tool in tools"
        :key="tool.id"
        class="tool-btn"
        :class="{ active: creatorStore.currentTool === tool.id }"
        :title="tool.label"
        @click="selectTool(tool.id)"
      >
        <!-- Pencil icon -->
        <svg v-if="tool.icon === 'pencil'" class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
        </svg>

        <!-- Eraser icon -->
        <svg v-if="tool.icon === 'eraser'" class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 20H7L2 15l10-10 8 8-5 7z"/>
          <path d="M6 11l4 4"/>
        </svg>

        <!-- Fill bucket icon -->
        <svg v-if="tool.icon === 'fill'" class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 11l-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2a2 2 0 0 0 2.8 0L19 11z"/>
          <path d="M5 2l5 5"/>
          <path d="M20 14c.5.5 1.5 2 1.5 3.5 0 1.5-1 2.5-2.5 2.5s-2.5-1-2.5-2.5c0-1.5 1-3 1.5-3.5l1-.5 1 .5z" fill="currentColor"/>
        </svg>

        <!-- Line icon -->
        <svg v-if="tool.icon === 'line'" class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="5" y1="19" x2="19" y2="5"/>
        </svg>

        <!-- Rectangle icon -->
        <svg v-if="tool.icon === 'rect'" class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
        </svg>

        <!-- Filled rectangle icon -->
        <svg v-if="tool.icon === 'rectFilled'" class="tool-icon" viewBox="0 0 24 24" fill="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
        </svg>

        <!-- Eyedropper icon -->
        <svg v-if="tool.icon === 'eyedropper'" class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M2 22l1-1h3l9-9"/>
          <path d="M3 21v-3l9-9"/>
          <circle cx="17.5" cy="6.5" r="3.5"/>
        </svg>
      </button>
    </div>

    <!-- Undo/Redo -->
    <div class="section-title mt-4">History</div>
    <div class="history-btns">
      <button
        class="history-btn"
        :disabled="!creatorStore.canUndo"
        @click="creatorStore.undo()"
        title="Undo"
      >
        <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 7v6h6"/>
          <path d="M3 13a9 9 0 1 0 3-7.7L3 7"/>
        </svg>
      </button>
      <button
        class="history-btn"
        :disabled="!creatorStore.canRedo"
        @click="creatorStore.redo()"
        title="Redo"
      >
        <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 7v6h-6"/>
          <path d="M21 13a9 9 0 1 1-3-7.7L21 7"/>
        </svg>
      </button>
    </div>

    <!-- Layer toggle -->
    <div class="section-title mt-4">Layer</div>
    <div class="layer-toggle">
      <button
        class="layer-btn"
        :class="{ active: creatorStore.currentLayer === 'solution' }"
        @click="creatorStore.currentLayer = 'solution'"
      >
        Solution
      </button>
      <button
        class="layer-btn"
        :class="{ active: creatorStore.currentLayer === 'reveal' }"
        @click="creatorStore.currentLayer = 'reveal'"
      >
        Reveal
      </button>
    </div>

    <!-- Clear button -->
    <button class="clear-btn mt-4" @click="creatorStore.clearGrid()">
      Clear Canvas
    </button>
  </div>
</template>

<style scoped>
.toolbar {
  padding: 12px;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border-radius: 8px;
  border: 2px solid transparent;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tool-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.tool-btn.active {
  background: #06b6d4;
  color: white;
  border-color: #0891b2;
}

.tool-icon {
  width: 20px;
  height: 20px;
}

.history-btns {
  display: flex;
  gap: 6px;
}

.history-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border-radius: 8px;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s ease;
}

.history-btn:hover:not(:disabled) {
  background: #e5e7eb;
  color: #374151;
}

.history-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.layer-toggle {
  display: flex;
  gap: 4px;
  background: #f3f4f6;
  padding: 4px;
  border-radius: 10px;
}

.layer-btn {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  background: transparent;
  color: #6b7280;
}

.layer-btn.active {
  background: white;
  color: #374151;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
}

.clear-btn {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: none;
  background: #fee2e2;
  color: #dc2626;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.clear-btn:hover {
  background: #fecaca;
}

.mt-4 {
  margin-top: 16px;
}
</style>
