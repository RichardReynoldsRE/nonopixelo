<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCreatorStore } from '@/stores/creatorStore'
import api from '@/services/api'

const router = useRouter()
const creatorStore = useCreatorStore()

const showNewPackModal = ref(false)
const isRebuilding = ref(false)
const newPackName = ref('')
const draggedPack = ref(null)
const dragOverIndex = ref(null)
const newPackIcon = ref('📦')
const newPackDescription = ref('')

const icons = [
  '📦', '🎨', '🎮', '🎯', '🎪', '🎭', '🎬', '📷',
  '🐱', '🐕', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐸', '🦋', '🐝',
  '🍕', '🍔', '🍩', '🍎', '🍓', '🍌', '🍪', '🎂', '☕', '🍦',
  '🌿', '🌸', '🌺', '🌻', '🌲', '🍀', '🌙', '⭐', '🌈', '☀️', '🌊', '❄️',
  '🚗', '🚀', '✈️', '🚂', '🚲', '⛵', '🚁',
  '❤️', '💎', '🔥', '⚡', '💫', '🎵', '🎸', '👑', '🏆', '💡',
  '⚽', '🏀', '🎾', '🏈', '⚾',
  '🏠', '🏰', '⛰️', '🗻', '🌍', '🎁', '💼', '📚', '✏️', '🔮'
]

// Stats
const totalPuzzles = computed(() => {
  return creatorStore.packs.reduce((sum, pack) => sum + (pack.puzzles?.length || 0), 0)
})

const publishedPacks = computed(() => {
  return creatorStore.packs.filter(p => p.published).length
})

onMounted(async () => {
  creatorStore.loadFromLocalStorage()
  const online = await creatorStore.checkOnline()
  if (online) {
    // Always sync from server when online - server is source of truth
    await creatorStore.syncFromServer()
  }
})

async function deployToGame() {
  if (!creatorStore.isOnline) {
    alert('Server not available. Make sure the API server is running (npm run server)')
    return
  }
  if (!confirm('This will sync all packs and rebuild the app. Continue?')) return

  isRebuilding.value = true
  try {
    await creatorStore.syncToServer()
    const syncResult = await api.packs.syncAllToGame()
    const buildResult = await api.packs.rebuild()
    alert(`Deployed successfully!\n\n${syncResult.count} packs synced.\nApp rebuilt and ready.`)
  } catch (err) {
    alert('Deploy failed: ' + err.message)
  } finally {
    isRebuilding.value = false
  }
}

function createNewPack() {
  if (!newPackName.value.trim()) return
  const pack = creatorStore.createPack({
    name: newPackName.value.trim(),
    description: newPackDescription.value.trim(),
    icon: newPackIcon.value
  })
  creatorStore.saveToLocalStorage()
  newPackName.value = ''
  newPackDescription.value = ''
  newPackIcon.value = '📦'
  showNewPackModal.value = false
  router.push(`/creator/pack/${pack.id}`)
}

function editPack(packId) {
  router.push(`/creator/pack/${packId}`)
}

function deletePack(pack, e) {
  e.stopPropagation()
  if (confirm(`Delete "${pack.name}" and all its puzzles?`)) {
    const index = creatorStore.packs.findIndex(p => p.id === pack.id)
    if (index >= 0) {
      creatorStore.packs.splice(index, 1)
      creatorStore.saveToLocalStorage()
    }
  }
}

function togglePublish(pack, e) {
  e.stopPropagation()
  pack.published = !pack.published
  pack.updatedAt = new Date().toISOString()
  creatorStore.saveToLocalStorage()
}

function toggleFeatured(pack, e) {
  e.stopPropagation()
  pack.featured = !pack.featured
  pack.updatedAt = new Date().toISOString()
  creatorStore.saveToLocalStorage()
}

function onDragStart(index) {
  draggedPack.value = index
}

function onDragOver(e, index) {
  e.preventDefault()
  dragOverIndex.value = index
}

function onDragLeave() {
  dragOverIndex.value = null
}

function onDrop(index) {
  if (draggedPack.value === null || draggedPack.value === index) {
    draggedPack.value = null
    dragOverIndex.value = null
    return
  }
  const packs = creatorStore.packs
  const [movedPack] = packs.splice(draggedPack.value, 1)
  packs.splice(index, 0, movedPack)
  creatorStore.saveToLocalStorage()
  draggedPack.value = null
  dragOverIndex.value = null
}

function onDragEnd() {
  draggedPack.value = null
  dragOverIndex.value = null
}

function createQuickPuzzle() {
  if (creatorStore.packs.length === 0) {
    creatorStore.createPack({ name: 'My Puzzles' })
    creatorStore.saveToLocalStorage()
  }
  const pack = creatorStore.packs[0]
  router.push(`/creator/puzzle/${pack.id}`)
}

function handleImport(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result)
      if (data.puzzles && Array.isArray(data.puzzles)) {
        data.id = `pack_${Date.now()}`
        data.createdAt = new Date().toISOString()
        data.updatedAt = new Date().toISOString()
        creatorStore.packs.push(data)
      } else if (data.solution) {
        if (creatorStore.packs.length === 0) {
          creatorStore.createPack({ name: 'Imported Puzzles' })
        }
        data.id = `puzzle_${Date.now()}`
        creatorStore.packs[0].puzzles.push(data)
      }
      creatorStore.saveToLocalStorage()
      alert('Import successful!')
    } catch (err) {
      alert('Invalid JSON file')
    }
  }
  reader.readAsText(file)
  e.target.value = ''
}

function exportAll() {
  const data = {
    exportedAt: new Date().toISOString(),
    packs: creatorStore.packs
  }
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'nonogram_packs_export.json'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="dashboard force-light">
    <!-- Header -->
    <header class="dashboard-header">
      <button class="back-btn" @click="router.push('/')">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div class="header-content">
        <h1>Puzzle Creator</h1>
        <p class="header-stats">
          {{ creatorStore.packs.length }} packs · {{ totalPuzzles }} puzzles · {{ publishedPacks }} published
        </p>
      </div>
      <div class="header-status" :class="{ online: creatorStore.isOnline }">
        {{ creatorStore.isOnline ? '● Online' : '○ Offline' }}
      </div>
    </header>

    <div class="dashboard-content">
      <!-- Quick Actions Bar -->
      <div class="action-bar">
        <button class="action-btn primary" @click="showNewPackModal = true">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          New Pack
        </button>
        <button class="action-btn" @click="createQuickPuzzle">
          <span>🎨</span> Quick Puzzle
        </button>
        <label class="action-btn">
          <input type="file" accept=".json" @change="handleImport" hidden />
          <span>📥</span> Import
        </label>
        <button class="action-btn" @click="exportAll" :disabled="creatorStore.packs.length === 0">
          <span>📤</span> Export
        </button>
        <button class="action-btn" @click="router.push('/creator/daily')">
          <span>📅</span> Daily
        </button>
        <button
          class="action-btn deploy"
          @click="deployToGame"
          :disabled="isRebuilding || !creatorStore.isOnline"
        >
          <span>🚀</span> {{ isRebuilding ? 'Deploying...' : 'Deploy' }}
        </button>
      </div>

      <!-- Packs Grid -->
      <section class="packs-section">
        <div class="section-header">
          <h2>My Packs</h2>
          <span class="section-badge">{{ creatorStore.packs.length }} packs</span>
        </div>

        <div v-if="creatorStore.packs.length === 0" class="empty-state">
          <div class="empty-icon">📦</div>
          <h3>No packs yet</h3>
          <p>Create your first puzzle pack to get started</p>
          <button class="empty-btn" @click="showNewPackModal = true">Create Pack</button>
        </div>

        <div v-else class="packs-grid">
          <div
            v-for="(pack, index) in creatorStore.packs"
            :key="pack.id"
            class="pack-card"
            :class="{
              featured: pack.featured,
              dragging: draggedPack === index,
              'drag-over': dragOverIndex === index
            }"
            draggable="true"
            @dragstart="onDragStart(index)"
            @dragover="onDragOver($event, index)"
            @dragleave="onDragLeave"
            @drop="onDrop(index)"
            @dragend="onDragEnd"
            @click="editPack(pack.id)"
          >
            <!-- Drag handle -->
            <div class="drag-handle" @click.stop>⋮⋮</div>

            <!-- Card top with icon -->
            <div class="pack-card-top" :class="pack.color || 'primary'">
              <span class="pack-icon">{{ pack.icon }}</span>
              <div class="pack-badges">
                <span v-if="pack.featured" class="badge featured">★</span>
                <span v-if="pack.published" class="badge published">✓</span>
                <span v-else class="badge draft">Draft</span>
              </div>
            </div>

            <!-- Card bottom with info -->
            <div class="pack-card-bottom">
              <h3>{{ pack.name }}</h3>
              <p class="pack-count">{{ pack.puzzles?.length || 0 }} puzzles</p>

              <div class="pack-actions">
                <button
                  class="pack-action-btn"
                  :class="{ active: pack.featured }"
                  @click="toggleFeatured(pack, $event)"
                  title="Toggle featured"
                >
                  {{ pack.featured ? '★' : '☆' }}
                </button>
                <button
                  class="pack-action-btn"
                  :class="{ published: pack.published }"
                  @click="togglePublish(pack, $event)"
                  title="Toggle publish"
                >
                  {{ pack.published ? '👁' : '👁‍🗨' }}
                </button>
                <button
                  class="pack-action-btn delete"
                  @click="deletePack(pack, $event)"
                  title="Delete pack"
                >
                  🗑
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- New Pack Modal -->
    <div v-if="showNewPackModal" class="modal-overlay" @click.self="showNewPackModal = false">
      <div class="modal">
        <h2>Create New Pack</h2>

        <div class="form-group">
          <label>Pack Name</label>
          <input
            v-model="newPackName"
            type="text"
            placeholder="e.g., Ocean Animals"
            class="form-input"
            @keyup.enter="createNewPack"
          />
        </div>

        <div class="form-group">
          <label>Icon</label>
          <div class="icon-grid">
            <button
              v-for="icon in icons"
              :key="icon"
              class="icon-btn"
              :class="{ selected: newPackIcon === icon }"
              @click="newPackIcon = icon"
            >
              {{ icon }}
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>Description (optional)</label>
          <input
            v-model="newPackDescription"
            type="text"
            placeholder="A brief description..."
            class="form-input"
          />
        </div>

        <div class="modal-actions">
          <button class="modal-btn cancel" @click="showNewPackModal = false">Cancel</button>
          <button class="modal-btn create" @click="createNewPack" :disabled="!newPackName.trim()">
            Create Pack
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}

/* Header */
.dashboard-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  padding: 8px;
  border-radius: 12px;
  background: #f1f5f9;
  color: #64748b;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #e2e8f0;
  color: #334155;
}

.header-content {
  flex: 1;
}

.header-content h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.header-stats {
  font-size: 0.875rem;
  color: #64748b;
  margin: 2px 0 0 0;
}

.header-status {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  padding: 6px 12px;
  background: #f1f5f9;
  border-radius: 20px;
}

.header-status.online {
  color: #22c55e;
  background: #f0fdf4;
}

/* Content */
.dashboard-content {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Action Bar */
.action-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: #f1f5f9;
  color: #475569;
}

.action-btn:hover:not(:disabled) {
  background: #e2e8f0;
  transform: translateY(-1px);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.primary {
  background: #06b6d4;
  color: white;
}

.action-btn.primary:hover {
  background: #0891b2;
}

.action-btn.deploy {
  background: #8b5cf6;
  color: white;
}

.action-btn.deploy:hover:not(:disabled) {
  background: #7c3aed;
}

/* Section */
.packs-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-header h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.section-badge {
  font-size: 0.75rem;
  color: #64748b;
  background: #e2e8f0;
  padding: 4px 10px;
  border-radius: 12px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 20px;
  border: 2px dashed #e2e8f0;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 1.25rem;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.empty-state p {
  color: #64748b;
  margin: 0 0 20px 0;
}

.empty-btn {
  padding: 12px 24px;
  background: #06b6d4;
  color: white;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.empty-btn:hover {
  background: #0891b2;
}

/* Packs Grid */
.packs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (min-width: 640px) {
  .packs-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 900px) {
  .packs-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Pack Card */
.pack-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: relative;
}

.pack-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.pack-card.featured {
  box-shadow: 0 0 0 2px #f59e0b, 0 4px 12px rgba(245, 158, 11, 0.2);
}

.pack-card.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.pack-card.drag-over {
  box-shadow: 0 0 0 2px #06b6d4;
}

.drag-handle {
  position: absolute;
  top: 8px;
  left: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  cursor: grab;
  z-index: 10;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.drag-handle:hover {
  color: white;
  background: rgba(0, 0, 0, 0.2);
}

.pack-card-top {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.pack-card-top.primary { background: linear-gradient(135deg, #06b6d4, #0891b2); }
.pack-card-top.coral { background: linear-gradient(135deg, #f97316, #ea580c); }
.pack-card-top.green { background: linear-gradient(135deg, #22c55e, #16a34a); }

.pack-icon {
  font-size: 3rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.pack-badges {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
}

.badge {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
}

.badge.featured {
  background: #fbbf24;
  color: white;
}

.badge.published {
  background: #22c55e;
  color: white;
}

.badge.draft {
  background: rgba(255, 255, 255, 0.9);
  color: #64748b;
  font-size: 0.6rem;
  width: auto;
  padding: 0 6px;
}

.pack-card-bottom {
  padding: 14px;
}

.pack-card-bottom h3 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 2px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pack-count {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0 0 12px 0;
}

.pack-actions {
  display: flex;
  gap: 6px;
}

.pack-action-btn {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 8px;
  background: #f1f5f9;
  color: #94a3b8;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.15s;
}

.pack-action-btn:hover {
  background: #e2e8f0;
  color: #64748b;
}

.pack-action-btn.active {
  background: #fef3c7;
  color: #f59e0b;
}

.pack-action-btn.published {
  background: #dcfce7;
  color: #22c55e;
}

.pack-action-btn.delete:hover {
  background: #fee2e2;
  color: #ef4444;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 20px;
  padding: 24px;
  max-width: 420px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 20px 0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #06b6d4;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
  max-height: 180px;
  overflow-y: auto;
  padding: 4px;
}

.icon-btn {
  aspect-ratio: 1;
  font-size: 1.25rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.15s;
}

.icon-btn:hover {
  border-color: #06b6d4;
  background: #ecfeff;
}

.icon-btn.selected {
  border-color: #06b6d4;
  background: #ecfeff;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.modal-btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn.cancel {
  background: #f1f5f9;
  color: #64748b;
}

.modal-btn.cancel:hover {
  background: #e2e8f0;
}

.modal-btn.create {
  background: #06b6d4;
  color: white;
}

.modal-btn.create:hover:not(:disabled) {
  background: #0891b2;
}

.modal-btn.create:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
