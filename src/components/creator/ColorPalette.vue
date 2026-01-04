<script setup>
import { ref } from 'vue'
import { useCreatorStore } from '@/stores/creatorStore'

const creatorStore = useCreatorStore()
const showColorPicker = ref(false)
const editingIndex = ref(-1)
const tempColor = ref('#000000')

const presetPalettes = [
  { name: 'Ocean', colors: ['#06B6D4', '#0891B2', '#164E63'] },
  { name: 'Sunset', colors: ['#F97316', '#EA580C', '#FBBF24'] },
  { name: 'Forest', colors: ['#22C55E', '#16A34A', '#92400E'] },
  { name: 'Berry', colors: ['#EC4899', '#BE185D', '#7C3AED'] },
  { name: 'Mono', colors: ['#374151', '#6B7280', '#D1D5DB'] },
  { name: 'Rainbow', colors: ['#EF4444', '#FBBF24', '#22C55E', '#3B82F6', '#8B5CF6'] }
]

function selectColor(index) {
  creatorStore.currentColorIndex = index + 1 // +1 because 0 is empty
}

function openColorPicker(index) {
  editingIndex.value = index
  tempColor.value = creatorStore.palette[index]
  showColorPicker.value = true
}

function saveColor() {
  if (editingIndex.value >= 0) {
    creatorStore.updateColor(editingIndex.value, tempColor.value)
  }
  showColorPicker.value = false
  editingIndex.value = -1
}

function addColor() {
  const newColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
  creatorStore.addColor(newColor)
}

function removeColor(index) {
  creatorStore.removeColor(index)
}

function applyPreset(preset) {
  creatorStore.palette = [...preset.colors]
  creatorStore.currentColorIndex = 1
}
</script>

<template>
  <div class="color-palette">
    <div class="section-title">Colors</div>

    <!-- Color swatches -->
    <div class="colors-grid">
      <button
        v-for="(color, index) in creatorStore.palette"
        :key="index"
        class="color-swatch"
        :class="{ active: creatorStore.currentColorIndex === index + 1 }"
        :style="{ backgroundColor: color }"
        @click="selectColor(index)"
        @dblclick="openColorPicker(index)"
      >
        <span v-if="creatorStore.currentColorIndex === index + 1" class="check-mark">✓</span>
      </button>

      <!-- Add color button -->
      <button
        v-if="creatorStore.palette.length < 8"
        class="add-color-btn"
        @click="addColor"
      >
        +
      </button>
    </div>

    <!-- Presets -->
    <div class="section-title mt-4">Presets</div>
    <div class="presets-grid">
      <button
        v-for="preset in presetPalettes"
        :key="preset.name"
        class="preset-btn"
        @click="applyPreset(preset)"
      >
        <div class="preset-colors">
          <span
            v-for="(color, i) in preset.colors.slice(0, 3)"
            :key="i"
            class="preset-dot"
            :style="{ backgroundColor: color }"
          />
        </div>
        <span class="preset-name">{{ preset.name }}</span>
      </button>
    </div>

    <!-- Color picker modal -->
    <div v-if="showColorPicker" class="color-picker-modal" @click.self="showColorPicker = false">
      <div class="color-picker-content">
        <h3>Edit Color</h3>
        <input
          type="color"
          v-model="tempColor"
          class="color-input"
        />
        <input
          type="text"
          v-model="tempColor"
          class="hex-input"
          placeholder="#000000"
        />
        <div class="picker-actions">
          <button class="btn-cancel" @click="showColorPicker = false">Cancel</button>
          <button class="btn-save" @click="saveColor">Save</button>
          <button
            v-if="editingIndex > 0"
            class="btn-delete"
            @click="removeColor(editingIndex); showColorPicker = false"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.color-palette {
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

.colors-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-swatch {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 3px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  box-shadow: 0 2px 4px rgb(0 0 0 / 0.1);
}

.color-swatch:hover {
  transform: scale(1.1);
}

.color-swatch.active {
  border-color: #374151;
  transform: scale(1.1);
}

.check-mark {
  color: white;
  font-weight: bold;
  text-shadow: 0 1px 2px rgb(0 0 0 / 0.3);
}

.add-color-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px dashed #d1d5db;
  background: #f9fafb;
  color: #9ca3af;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.add-color-btn:hover {
  border-color: #9ca3af;
  color: #6b7280;
}

.presets-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.preset-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  background: #f3f4f6;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
}

.preset-btn:hover {
  background: #e5e7eb;
}

.preset-colors {
  display: flex;
  gap: 2px;
}

.preset-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.preset-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: #4b5563;
}

.color-picker-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.color-picker-content {
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 200px;
}

.color-picker-content h3 {
  font-weight: 700;
  color: #374151;
  margin: 0;
}

.color-input {
  width: 100%;
  height: 60px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.hex-input {
  padding: 8px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-family: monospace;
  font-size: 1rem;
}

.picker-actions {
  display: flex;
  gap: 8px;
}

.btn-cancel, .btn-save, .btn-delete {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.btn-cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-save {
  background: #06b6d4;
  color: white;
}

.btn-delete {
  background: #ef4444;
  color: white;
}
</style>
