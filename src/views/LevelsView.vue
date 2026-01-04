<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProgressStore } from '@/stores/progressStore'
import { getAllPacks } from '@/data/puzzles'

const router = useRouter()
const progressStore = useProgressStore()
const allPacks = getAllPacks()

// Featured pack (first pack with most puzzles or marked as featured)
const featuredPack = computed(() => {
  const featured = allPacks.find(p => p.featured)
  if (featured) return featured
  // Otherwise pick the pack with most puzzles
  return [...allPacks].sort((a, b) => b.puzzles.length - a.puzzles.length)[0]
})

// All packs except featured
const regularPacks = computed(() => {
  return allPacks.filter(p => p.id !== featuredPack.value?.id)
})

function getPackCompletedCount(packId) {
  const progress = progressStore.getPackProgress(packId)
  return Object.keys(progress).length
}

function getPackTotalCount(packId) {
  const pack = allPacks.find(p => p.id === packId)
  return pack?.puzzles.length || 0
}

function getCompletionPercent(packId) {
  const total = getPackTotalCount(packId)
  if (total === 0) return 0
  return Math.round((getPackCompletedCount(packId) / total) * 100)
}

// Get max possible stars for a pack (3 per puzzle)
function getPackMaxStars(packId) {
  return getPackTotalCount(packId) * 3
}

function navigateToPack(pack) {
  if (progressStore.isPackUnlocked(pack.id)) {
    router.push(`/levels/${pack.id}`)
  }
}

// Get unlock requirement info for a pack
function getUnlockInfo(packId) {
  return progressStore.getUnlockRequirement(packId)
}

// Get a sample of puzzle sizes for display
function getSizeRange(pack) {
  const sizes = [...new Set(pack.puzzles.map(p => p.size))].sort((a, b) => a - b)
  if (sizes.length === 1) return `${sizes[0]}×${sizes[0]}`
  return `${sizes[0]}×${sizes[0]} - ${sizes[sizes.length-1]}×${sizes[sizes.length-1]}`
}
</script>

<template>
  <div class="levels-view">
    <!-- Header -->
    <header class="levels-header">
      <button class="back-btn" @click="router.push('/')">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div class="header-content">
        <h1>Puzzle Packs</h1>
        <p class="header-stats">
          {{ progressStore.totalCompleted }} puzzles solved · {{ progressStore.totalStars }} ⭐
        </p>
      </div>
    </header>

    <div class="levels-content">
      <!-- Featured Pack Hero -->
      <section class="featured-section" v-if="featuredPack">
        <div
          class="featured-card"
          @click="navigateToPack(featuredPack)"
        >
          <div class="featured-bg" :class="`bg-${featuredPack.color || 'primary'}`"></div>
          <div class="featured-content">
            <span class="featured-badge">FEATURED</span>
            <div class="featured-icon">{{ featuredPack.icon }}</div>
            <h2 class="featured-title">{{ featuredPack.name }}</h2>
            <p class="featured-desc">{{ featuredPack.description }}</p>
            <div class="featured-meta">
              <span class="meta-item">
                <span class="meta-icon">📦</span>
                {{ featuredPack.puzzles.length }} puzzles
              </span>
              <span class="meta-item">
                <span class="meta-icon">📐</span>
                {{ getSizeRange(featuredPack) }}
              </span>
            </div>
            <div class="featured-progress">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: `${getCompletionPercent(featuredPack.id)}%` }"
                ></div>
              </div>
              <span class="progress-text">{{ getCompletionPercent(featuredPack.id) }}%</span>
              <span class="progress-divider">·</span>
              <span class="progress-text">⭐ {{ progressStore.getPackStars(featuredPack.id) }}/{{ getPackMaxStars(featuredPack.id) }}</span>
            </div>
          </div>
          <div class="featured-arrow">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </section>

      <!-- All Packs Grid -->
      <section class="packs-section">
        <div class="section-header">
          <h3>All Packs</h3>
          <span class="section-badge">{{ regularPacks.length }} packs</span>
        </div>
        <div class="packs-grid">
          <div
            v-for="pack in regularPacks"
            :key="pack.id"
            class="pack-card"
            :class="{ locked: !progressStore.isPackUnlocked(pack.id) }"
            @click="navigateToPack(pack)"
          >
            <div class="pack-card-top" :class="`bg-${pack.color || 'primary'}`">
              <span class="pack-icon">{{ pack.icon }}</span>
              <span v-if="!progressStore.isPackUnlocked(pack.id)" class="lock-icon">🔒</span>
              <span v-else-if="getCompletionPercent(pack.id) === 100" class="complete-icon">✓</span>
            </div>
            <div class="pack-card-bottom">
              <h4>{{ pack.name }}</h4>
              <!-- Show unlock requirement for locked packs -->
              <div v-if="!progressStore.isPackUnlocked(pack.id) && getUnlockInfo(pack.id)" class="unlock-requirement">
                <template v-if="getUnlockInfo(pack.id).type === 'after_pack'">
                  <span class="unlock-icon">{{ getUnlockInfo(pack.id).requiredPackIcon }}</span>
                  <span class="unlock-text">
                    {{ getUnlockInfo(pack.id).currentCount }}/{{ getUnlockInfo(pack.id).requiredCount }}
                  </span>
                </template>
                <template v-else-if="getUnlockInfo(pack.id).type === 'total_puzzles'">
                  <span class="unlock-icon">🧩</span>
                  <span class="unlock-text">
                    {{ getUnlockInfo(pack.id).currentCount }}/{{ getUnlockInfo(pack.id).requiredCount }} total
                  </span>
                </template>
              </div>
              <!-- Show progress for unlocked packs -->
              <template v-else>
                <div class="pack-progress-bar">
                  <div
                    class="pack-progress-fill"
                    :class="`bg-${pack.color || 'primary'}`"
                    :style="{ width: `${getCompletionPercent(pack.id)}%` }"
                  ></div>
                </div>
                <div class="pack-stats">
                  <span class="pack-percent">{{ getCompletionPercent(pack.id) }}%</span>
                  <span class="pack-stars">⭐ {{ progressStore.getPackStars(pack.id) }}/{{ getPackMaxStars(pack.id) }}</span>
                </div>
              </template>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.levels-view {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}

.levels-header {
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

.levels-content {
  padding: 20px;
  padding-bottom: 40px;
}

/* Featured Section */
.featured-section {
  margin-bottom: 28px;
}

.featured-card {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.featured-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}

.featured-bg {
  position: absolute;
  inset: 0;
  opacity: 0.15;
}

.featured-bg.bg-primary { background: linear-gradient(135deg, #06b6d4, #0891b2); opacity: 0.2; }
.featured-bg.bg-coral { background: linear-gradient(135deg, #f97316, #ea580c); opacity: 0.2; }
.featured-bg.bg-green { background: linear-gradient(135deg, #22c55e, #16a34a); opacity: 0.2; }

.featured-content {
  position: relative;
  padding: 24px;
  background: white;
}

.featured-badge {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #06b6d4;
  background: #ecfeff;
  padding: 4px 10px;
  border-radius: 20px;
  margin-bottom: 12px;
}

.featured-icon {
  font-size: 3rem;
  margin-bottom: 8px;
}

.featured-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.featured-desc {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0 0 16px 0;
}

.featured-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #475569;
}

.featured-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #06b6d4, #0891b2);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  white-space: nowrap;
}

.progress-divider {
  color: #cbd5e1;
}

.featured-arrow {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: #cbd5e1;
}

/* Horizontal Scroll Section */
.packs-section {
  margin-bottom: 28px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  padding: 0 4px;
}

.section-header h3 {
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

.horizontal-scroll {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding: 4px;
  margin: -4px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.horizontal-scroll::-webkit-scrollbar {
  display: none;
}

.pack-card-horizontal {
  flex-shrink: 0;
  width: 180px;
  background: white;
  border-radius: 18px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 2px solid transparent;
}

.pack-card-horizontal:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
  border-color: rgba(6, 182, 212, 0.3);
}

.pack-card-horizontal:active {
  transform: translateY(-1px) scale(0.99);
}

.pack-card-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  margin-bottom: 12px;
}

.pack-card-icon.bg-primary { background: linear-gradient(135deg, #ecfeff, #cffafe); }
.pack-card-icon.bg-coral { background: linear-gradient(135deg, #fff7ed, #ffedd5); }
.pack-card-icon.bg-green { background: linear-gradient(135deg, #f0fdf4, #dcfce7); }

.pack-card-info h4 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.pack-stats-line {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.stats-divider {
  color: #cbd5e1;
}

.pack-card-progress {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 40px;
  height: 40px;
}

.pack-card-horizontal {
  position: relative;
}

.progress-ring {
  width: 40px;
  height: 40px;
  transform: rotate(-90deg);
}

.progress-ring-bg {
  fill: none;
  stroke: #e2e8f0;
  stroke-width: 3;
}

.progress-ring-fill {
  fill: none;
  stroke: #06b6d4;
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray 0.5s ease;
}

.progress-percent {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  color: #475569;
}

/* Grid Section */
.packs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

@media (min-width: 640px) {
  .packs-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.pack-card {
  background: white;
  border-radius: 18px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 2px solid transparent;
}

.pack-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
  border-color: rgba(6, 182, 212, 0.3);
}

.pack-card:active {
  transform: translateY(-1px) scale(0.99);
}

.pack-card.locked {
  opacity: 0.7;
  cursor: not-allowed;
}

.pack-card.locked:hover {
  transform: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-color: transparent;
}

.pack-card-top {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.pack-card-top.bg-primary { background: linear-gradient(135deg, #ecfeff, #cffafe); }
.pack-card-top.bg-coral { background: linear-gradient(135deg, #fff7ed, #ffedd5); }
.pack-card-top.bg-green { background: linear-gradient(135deg, #f0fdf4, #dcfce7); }

.pack-icon {
  font-size: 2.5rem;
}

.lock-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 1rem;
}

.complete-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 22px;
  height: 22px;
  background: #22c55e;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}

.pack-card-bottom {
  padding: 14px;
}

.pack-card-bottom h4 {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 2px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pack-puzzles {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0 0 10px 0;
}

.pack-progress-bar {
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.pack-progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.pack-progress-fill.bg-primary { background: #06b6d4; }
.pack-progress-fill.bg-coral { background: #f97316; }
.pack-progress-fill.bg-green { background: #22c55e; }

.pack-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #94a3b8;
}

/* Unlock Requirement */
.unlock-requirement {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 0;
  color: #64748b;
}

.unlock-requirement .unlock-icon {
  font-size: 1rem;
}

.unlock-requirement .unlock-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
}

/* Dark mode */
.dark .levels-view {
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
}

.dark .levels-header {
  background: #1e293b;
  border-color: #334155;
}

.dark .back-btn {
  background: #334155;
  color: #94a3b8;
}

.dark .header-content h1 {
  color: #f1f5f9;
}

.dark .featured-content,
.dark .pack-card-horizontal,
.dark .pack-card {
  background: #1e293b;
}

.dark .featured-title,
.dark .pack-card-info h4,
.dark .pack-card-bottom h4,
.dark .section-header h3 {
  color: #f1f5f9;
}

.dark .featured-desc,
.dark .pack-card-info p,
.dark .pack-puzzles,
.dark .progress-text,
.dark .header-stats {
  color: #94a3b8;
}

.dark .progress-bar,
.dark .pack-progress-bar {
  background: #334155;
}

.dark .section-badge {
  background: #334155;
  color: #94a3b8;
}

.dark .progress-ring-bg {
  stroke: #334155;
}

.dark .progress-percent,
.dark .meta-item {
  color: #cbd5e1;
}

.dark .unlock-requirement .unlock-text {
  color: #94a3b8;
}

.dark .stats-divider,
.dark .progress-divider {
  color: #475569;
}

.dark .pack-stats-line {
  color: #94a3b8;
}
</style>
