<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCreatorStore } from '@/stores/creatorStore'
import { getAllPacks } from '@/data/puzzles'

const props = defineProps({
  packId: String
})

const router = useRouter()
const creatorStore = useCreatorStore()

const pack = ref(null)
const isEditing = ref(false)
const editName = ref('')
const editDescription = ref('')
const editIcon = ref('')
const editIsEvent = ref(false)
const editEventStart = ref('')
const editEventEnd = ref('')
const editHighlightColor = ref('')
const editUnlockType = ref('always')
const editUnlockPackId = ref('')
const editUnlockPuzzleCount = ref(1)
const searchQuery = ref('')
const showDeleteConfirm = ref(null)
const draggedIndex = ref(null)
const dragOverIndex = ref(null)

// Get all other packs for unlock requirement selector
const otherPacks = computed(() => {
  return getAllPacks().filter(p => p.id !== props.packId)
})

const icons = [
  '📦', '🎨', '🎮', '🎯', '🎪', '🎭', '🎬', '📷',
  '🐱', '🐕', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐸', '🦋', '🐝',
  '🍕', '🍔', '🍩', '🍎', '🍓', '🍌', '🍪', '🎂', '☕', '🍦',
  '🌿', '🌸', '🌺', '🌻', '🌲', '🍀', '🌙', '⭐', '🌈', '☀️', '🌊', '❄️',
  '🚗', '🚀', '✈️', '🚂', '🚲', '⛵', '🚁',
  '❤️', '💎', '🔥', '⚡', '💫', '🎵', '🎸', '👑', '🏆', '💡',
  '⚽', '🏀', '🎾', '🏈', '⚾',
  '🎃', '🎄', '💝', '🐣', '🎆',
  '🏠', '🏰', '⛰️', '🗻', '🌍', '🎁', '💼', '📚', '✏️', '🔮'
]

const highlightColors = [
  { color: '', label: 'Default' },
  { color: '#eab308', label: 'Yellow' },
  { color: '#f59e0b', label: 'Amber' },
  { color: '#ef4444', label: 'Red' },
  { color: '#ec4899', label: 'Pink' },
  { color: '#8b5cf6', label: 'Purple' },
  { color: '#3b82f6', label: 'Blue' },
  { color: '#06b6d4', label: 'Cyan' },
  { color: '#22c55e', label: 'Green' }
]

const filteredPuzzles = computed(() => {
  if (!pack.value?.puzzles) return []
  if (!searchQuery.value.trim()) return pack.value.puzzles

  const query = searchQuery.value.toLowerCase()
  return pack.value.puzzles.filter(p =>
    p.name.toLowerCase().includes(query)
  )
})

const packStats = computed(() => {
  if (!pack.value?.puzzles) return { total: 0, sizes: {} }

  const sizes = {}
  pack.value.puzzles.forEach(p => {
    const key = `${p.size}x${p.size}`
    sizes[key] = (sizes[key] || 0) + 1
  })

  return {
    total: pack.value.puzzles.length,
    sizes
  }
})

onMounted(() => {
  creatorStore.loadFromLocalStorage()
  pack.value = creatorStore.packs.find(p => p.id === props.packId)

  if (!pack.value) {
    router.push('/creator')
  }
})

function startEditing() {
  editName.value = pack.value.name
  editDescription.value = pack.value.description || ''
  editIcon.value = pack.value.icon
  editIsEvent.value = pack.value.isEvent || false
  editEventStart.value = pack.value.eventStart ? pack.value.eventStart.split('T')[0] : ''
  editEventEnd.value = pack.value.eventEnd ? pack.value.eventEnd.split('T')[0] : ''
  editHighlightColor.value = pack.value.highlightColor || ''
  editUnlockType.value = pack.value.unlockType || 'always'
  editUnlockPackId.value = pack.value.unlockRequirement?.packId || ''
  editUnlockPuzzleCount.value = pack.value.unlockRequirement?.puzzleCount || 1
  isEditing.value = true
}

function savePackInfo() {
  pack.value.name = editName.value.trim() || pack.value.name
  pack.value.description = editDescription.value.trim()
  pack.value.icon = editIcon.value
  pack.value.isEvent = editIsEvent.value
  pack.value.eventStart = editIsEvent.value && editEventStart.value ? new Date(editEventStart.value).toISOString() : null
  pack.value.eventEnd = editIsEvent.value && editEventEnd.value ? new Date(editEventEnd.value).toISOString() : null
  pack.value.highlightColor = editHighlightColor.value || null
  pack.value.unlockType = editUnlockType.value
  // Set unlock requirement based on type
  if (editUnlockType.value === 'after_pack' && editUnlockPackId.value) {
    pack.value.unlockRequirement = {
      packId: editUnlockPackId.value,
      puzzleCount: editUnlockPuzzleCount.value || 1
    }
  } else if (editUnlockType.value === 'total_puzzles') {
    pack.value.unlockRequirement = {
      puzzleCount: editUnlockPuzzleCount.value || 1
    }
  } else {
    pack.value.unlockRequirement = null
  }
  pack.value.updatedAt = new Date().toISOString()
  creatorStore.saveToLocalStorage()
  isEditing.value = false
}

function createNewPuzzle() {
  router.push(`/creator/puzzle/${props.packId}`)
}

function editPuzzle(puzzleId) {
  router.push(`/creator/puzzle/${props.packId}/${puzzleId}`)
}

function confirmDelete(puzzle) {
  showDeleteConfirm.value = puzzle
}

function deletePuzzle() {
  if (!showDeleteConfirm.value) return

  const index = pack.value.puzzles.findIndex(p => p.id === showDeleteConfirm.value.id)
  if (index >= 0) {
    pack.value.puzzles.splice(index, 1)
    creatorStore.saveToLocalStorage()
  }
  showDeleteConfirm.value = null
}

function duplicatePuzzle(puzzle) {
  const newPuzzle = JSON.parse(JSON.stringify(puzzle))
  newPuzzle.id = `puzzle_${Date.now()}`
  newPuzzle.name = `${puzzle.name} (copy)`
  newPuzzle.createdAt = new Date().toISOString()
  newPuzzle.updatedAt = new Date().toISOString()

  const index = pack.value.puzzles.findIndex(p => p.id === puzzle.id)
  pack.value.puzzles.splice(index + 1, 0, newPuzzle)
  creatorStore.saveToLocalStorage()
}

// Drag and drop handlers
function handleDragStart(index) {
  draggedIndex.value = index
}

function handleDragOver(e, index) {
  e.preventDefault()
  dragOverIndex.value = index
}

function handleDragEnd() {
  if (draggedIndex.value !== null && dragOverIndex.value !== null && draggedIndex.value !== dragOverIndex.value) {
    const puzzles = pack.value.puzzles
    const draggedItem = puzzles[draggedIndex.value]
    puzzles.splice(draggedIndex.value, 1)
    puzzles.splice(dragOverIndex.value, 0, draggedItem)
    creatorStore.saveToLocalStorage()
  }
  draggedIndex.value = null
  dragOverIndex.value = null
}

function exportPack() {
  const data = JSON.parse(JSON.stringify(pack.value))
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `${pack.value.name.toLowerCase().replace(/\s+/g, '_')}_pack.json`
  a.click()

  URL.revokeObjectURL(url)
}

function getPreviewColor(puzzle, row, col) {
  const value = puzzle.revealImage?.[row]?.[col] ?? puzzle.solution?.[row]?.[col] ?? 0
  if (value === 0) return 'transparent'
  if (!puzzle.palette || puzzle.palette.length === 0) return '#06b6d4'
  return puzzle.palette[(value - 1) % puzzle.palette.length] || '#06b6d4'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="pack-editor force-light" v-if="pack">
    <!-- Header -->
    <header class="editor-header">
      <div class="header-top">
        <button class="back-btn" @click="router.push('/creator')">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 19l-7-7 7-7"/>
          </svg>
          <span>Back</span>
        </button>

        <div class="header-actions">
          <button class="action-btn secondary" @click="exportPack">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
          <button class="action-btn primary" @click="createNewPuzzle">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            New Puzzle
          </button>
        </div>
      </div>

      <!-- Pack Info Section -->
      <div class="pack-info-section" v-if="!isEditing">
        <div class="pack-icon-large">{{ pack.icon }}</div>
        <div class="pack-details">
          <div class="pack-name-row">
            <h1>{{ pack.name }}</h1>
            <span v-if="pack.isEvent" class="event-badge">Event Pack</span>
          </div>
          <p class="pack-description" v-if="pack.description">{{ pack.description }}</p>
          <div class="pack-meta">
            <span class="meta-item">
              <strong>{{ packStats.total }}</strong> puzzles
            </span>
            <span class="meta-item" v-for="(count, size) in packStats.sizes" :key="size">
              {{ count }}× {{ size }}
            </span>
            <span class="meta-item" v-if="pack.isEvent && pack.eventStart">
              📅 {{ formatDate(pack.eventStart) }} - {{ pack.eventEnd ? formatDate(pack.eventEnd) : 'Ongoing' }}
            </span>
            <span class="meta-item unlock-info" v-if="pack.unlockType === 'after_pack' && pack.unlockRequirement">
              🔒 Unlocks after {{ pack.unlockRequirement.puzzleCount }} puzzle{{ pack.unlockRequirement.puzzleCount > 1 ? 's' : '' }} from {{ otherPacks.find(p => p.id === pack.unlockRequirement.packId)?.name || pack.unlockRequirement.packId }}
            </span>
            <span class="meta-item unlock-info" v-else-if="pack.unlockType === 'total_puzzles' && pack.unlockRequirement">
              🔒 Unlocks after {{ pack.unlockRequirement.puzzleCount }} total puzzle{{ pack.unlockRequirement.puzzleCount > 1 ? 's' : '' }}
            </span>
            <span class="meta-item unlock-info" v-else-if="!pack.unlockType || pack.unlockType === 'always'">
              🔓 Always unlocked
            </span>
          </div>
        </div>
        <button class="edit-pack-btn" @click="startEditing">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit Pack Info
        </button>
      </div>

      <!-- Edit Form -->
      <div class="edit-form" v-else>
        <div class="form-grid">
          <div class="form-group icon-group">
            <label>Icon</label>
            <div class="icon-input-wrapper">
              <input
                v-model="editIcon"
                type="text"
                class="emoji-input"
                maxlength="2"
              />
              <div class="icon-grid">
                <button
                  v-for="icon in icons.slice(0, 24)"
                  :key="icon"
                  class="icon-option"
                  :class="{ selected: editIcon === icon }"
                  @click="editIcon = icon"
                >{{ icon }}</button>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Pack Name</label>
            <input v-model="editName" type="text" class="form-input" placeholder="Pack name" />
          </div>

          <div class="form-group">
            <label>Description</label>
            <input v-model="editDescription" type="text" class="form-input" placeholder="Optional description" />
          </div>

          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="editIsEvent" />
              <span>Event Pack</span>
            </label>
          </div>

          <template v-if="editIsEvent">
            <div class="form-group">
              <label>Start Date</label>
              <input v-model="editEventStart" type="date" class="form-input" />
            </div>
            <div class="form-group">
              <label>End Date</label>
              <input v-model="editEventEnd" type="date" class="form-input" />
            </div>
          </template>

          <div class="form-group" v-if="editIsEvent">
            <label>Highlight Color</label>
            <div class="color-options">
              <button
                v-for="opt in highlightColors"
                :key="opt.color"
                class="color-option"
                :class="{ selected: editHighlightColor === opt.color }"
                :style="opt.color ? { backgroundColor: opt.color } : {}"
                @click="editHighlightColor = opt.color"
                :title="opt.label"
              >
                <span v-if="!opt.color">✕</span>
              </button>
            </div>
          </div>

          <!-- Unlock Settings -->
          <div class="form-group unlock-settings-group">
            <label>Unlock Requirement</label>
            <select v-model="editUnlockType" class="form-input">
              <option value="always">Always Unlocked</option>
              <option value="after_pack">After Completing Pack</option>
              <option value="total_puzzles">After Total Puzzles</option>
            </select>
          </div>

          <template v-if="editUnlockType === 'after_pack'">
            <div class="form-group">
              <label>Required Pack</label>
              <select v-model="editUnlockPackId" class="form-input">
                <option value="">Select a pack...</option>
                <option v-for="p in otherPacks" :key="p.id" :value="p.id">
                  {{ p.icon }} {{ p.name }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Puzzles Needed</label>
              <input
                v-model.number="editUnlockPuzzleCount"
                type="number"
                min="1"
                class="form-input"
                placeholder="1"
              />
            </div>
          </template>

          <div class="form-group" v-if="editUnlockType === 'total_puzzles'">
            <label>Total Puzzles Needed</label>
            <input
              v-model.number="editUnlockPuzzleCount"
              type="number"
              min="1"
              class="form-input"
              placeholder="10"
            />
          </div>
        </div>

        <div class="form-actions">
          <button class="cancel-btn" @click="isEditing = false">Cancel</button>
          <button class="save-btn" @click="savePackInfo">Save Changes</button>
        </div>
      </div>
    </header>

    <!-- Toolbar -->
    <div class="toolbar" v-if="pack.puzzles.length > 0">
      <div class="search-box">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search puzzles..."
        />
      </div>
      <div class="toolbar-info">
        <span v-if="searchQuery">{{ filteredPuzzles.length }} of {{ pack.puzzles.length }} puzzles</span>
        <span v-else>Drag to reorder</span>
      </div>
    </div>

    <!-- Puzzles Grid -->
    <div class="puzzles-container">
      <div v-if="pack.puzzles.length === 0" class="empty-state">
        <div class="empty-icon">🎨</div>
        <h3>No puzzles yet</h3>
        <p>Create your first puzzle to get started</p>
        <button class="create-first-btn" @click="createNewPuzzle">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Create Puzzle
        </button>
      </div>

      <div v-else class="puzzles-grid">
        <div
          v-for="(puzzle, index) in filteredPuzzles"
          :key="puzzle.id"
          class="puzzle-card"
          :class="{
            dragging: draggedIndex === index,
            'drag-over': dragOverIndex === index && draggedIndex !== index
          }"
          draggable="true"
          @dragstart="handleDragStart(index)"
          @dragover="handleDragOver($event, index)"
          @dragend="handleDragEnd"
        >
          <div class="puzzle-preview" @click="editPuzzle(puzzle.id)">
            <div class="puzzle-number">{{ index + 1 }}</div>
            <div
              class="preview-grid"
              :style="{
                gridTemplateColumns: `repeat(${puzzle.size}, 1fr)`,
                gridTemplateRows: `repeat(${puzzle.size}, 1fr)`
              }"
            >
              <template v-for="r in puzzle.size" :key="`row-${r}`">
                <div
                  v-for="c in puzzle.size"
                  :key="`${r}-${c}`"
                  class="preview-cell"
                  :style="{ backgroundColor: getPreviewColor(puzzle, r-1, c-1) }"
                />
              </template>
            </div>
            <div class="preview-overlay">
              <span>Edit</span>
            </div>
          </div>

          <div class="puzzle-info">
            <h3>{{ puzzle.name }}</h3>
            <div class="puzzle-meta">
              <span class="size-badge">{{ puzzle.size }}×{{ puzzle.size }}</span>
            </div>
          </div>

          <div class="puzzle-actions">
            <button class="icon-btn" @click="duplicatePuzzle(puzzle)" title="Duplicate">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
            <button class="icon-btn danger" @click="confirmDelete(puzzle)" title="Delete">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click="showDeleteConfirm = null">
      <div class="modal" @click.stop>
        <h3>Delete Puzzle?</h3>
        <p>Are you sure you want to delete "{{ showDeleteConfirm.name }}"? This cannot be undone.</p>
        <div class="modal-actions">
          <button class="cancel-btn" @click="showDeleteConfirm = null">Cancel</button>
          <button class="delete-btn" @click="deletePuzzle">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pack-editor {
  min-height: 100vh;
  background: #f8fafc;
}

.editor-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 16px 24px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #475569;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}

.back-btn:hover {
  background: #e2e8f0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn.secondary {
  background: #f1f5f9;
  color: #475569;
}

.action-btn.secondary:hover {
  background: #e2e8f0;
}

.action-btn.primary {
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  color: white;
  box-shadow: 0 2px 8px rgba(6, 182, 212, 0.3);
}

.action-btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
}

/* Pack Info Section */
.pack-info-section {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f0fdfa, #ecfeff);
  border-radius: 16px;
}

.pack-icon-large {
  font-size: 3.5rem;
  line-height: 1;
  background: white;
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.pack-details {
  flex: 1;
}

.pack-name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.pack-name-row h1 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.event-badge {
  padding: 4px 12px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
}

.pack-description {
  color: #64748b;
  margin: 0 0 12px 0;
}

.pack-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.meta-item {
  font-size: 0.875rem;
  color: #64748b;
}

.meta-item strong {
  color: #0f172a;
}

.unlock-info {
  color: #0891b2;
  font-weight: 500;
}

.edit-pack-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  color: #475569;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.edit-pack-btn:hover {
  border-color: #06b6d4;
  color: #06b6d4;
}

/* Edit Form */
.edit-form {
  padding: 20px;
  background: #f8fafc;
  border-radius: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.form-input {
  padding: 10px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.15s;
}

.form-input:focus {
  outline: none;
  border-color: #06b6d4;
}

.icon-group {
  grid-column: span 2;
}

.icon-input-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.emoji-input {
  width: 64px;
  height: 64px;
  font-size: 2rem;
  text-align: center;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
}

.emoji-input:focus {
  outline: none;
  border-color: #06b6d4;
}

.icon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 300px;
}

.icon-option {
  width: 32px;
  height: 32px;
  border: 2px solid transparent;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.1s;
}

.icon-option:hover {
  background: #f0fdfa;
}

.icon-option.selected {
  border-color: #06b6d4;
  background: #ecfeff;
}

.checkbox-group {
  justify-content: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #374151;
}

.checkbox-label input {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.color-options {
  display: flex;
  gap: 8px;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 3px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: #9ca3af;
  background: #f1f5f9;
  transition: all 0.1s;
}

.color-option.selected {
  border-color: #0f172a;
  transform: scale(1.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn, .save-btn {
  padding: 10px 24px;
  border-radius: 10px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.cancel-btn {
  background: #f1f5f9;
  color: #475569;
}

.save-btn {
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  color: white;
}

/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f1f5f9;
  border-radius: 10px;
  color: #64748b;
}

.search-box input {
  border: none;
  background: none;
  outline: none;
  width: 200px;
  font-size: 0.9rem;
}

.toolbar-info {
  font-size: 0.875rem;
  color: #94a3b8;
}

/* Puzzles Container */
.puzzles-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.empty-state {
  text-align: center;
  padding: 80px 40px;
  background: white;
  border-radius: 20px;
  border: 2px dashed #cbd5e1;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.empty-state p {
  color: #64748b;
  margin: 0 0 24px 0;
}

.create-first-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  color: white;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
}

.puzzles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
}

.puzzle-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 2px solid transparent;
  transition: all 0.2s;
  cursor: grab;
}

.puzzle-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.puzzle-card.dragging {
  opacity: 0.5;
  cursor: grabbing;
}

.puzzle-card.drag-over {
  border-color: #06b6d4;
  background: #f0fdfa;
}

.puzzle-preview {
  position: relative;
  aspect-ratio: 1;
  padding: 16px;
  background: #f8fafc;
  cursor: pointer;
}

.puzzle-number {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 24px;
  height: 24px;
  background: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.preview-grid {
  display: grid;
  gap: 1px;
  width: 100%;
  height: 100%;
  background: #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.preview-cell {
  background: white;
}

.preview-overlay {
  position: absolute;
  inset: 0;
  background: rgba(6, 182, 212, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s;
}

.preview-overlay span {
  color: white;
  font-weight: 700;
  font-size: 1rem;
}

.puzzle-preview:hover .preview-overlay {
  opacity: 1;
}

.puzzle-info {
  padding: 12px 16px;
}

.puzzle-info h3 {
  font-weight: 700;
  color: #1e293b;
  font-size: 0.9rem;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.puzzle-meta {
  display: flex;
  gap: 8px;
}

.size-badge {
  font-size: 0.75rem;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
}

.puzzle-actions {
  display: flex;
  gap: 8px;
  padding: 8px 16px 16px;
}

.icon-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: #f1f5f9;
  border: none;
  border-radius: 8px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}

.icon-btn:hover {
  background: #e2e8f0;
  color: #374151;
}

.icon-btn.danger:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: white;
  border-radius: 20px;
  padding: 32px;
  max-width: 400px;
  width: 90%;
}

.modal h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.modal p {
  color: #64748b;
  margin: 0 0 24px 0;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.delete-btn {
  padding: 10px 24px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}

/* Responsive */
@media (max-width: 768px) {
  .editor-header {
    padding: 12px 16px;
  }

  .header-top {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .header-actions {
    justify-content: stretch;
  }

  .action-btn {
    flex: 1;
    justify-content: center;
  }

  .pack-info-section {
    flex-direction: column;
    text-align: center;
  }

  .pack-meta {
    justify-content: center;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .icon-group {
    grid-column: span 1;
  }

  .puzzles-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
</style>
