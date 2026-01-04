<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getDailyPuzzle } from '@/composables/usePuzzleGenerator'
import { getScheduledPuzzle, getDailyOverride } from '@/data/dailyPuzzles'

const router = useRouter()

function editPuzzle(dateStr) {
  router.push(`/creator/daily/${dateStr}`)
}

// Generate dates from today through Dec 31, 2026
const dates = computed(() => {
  const result = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endDate = new Date('2026-12-31T12:00:00')

  let currentDate = new Date(today)
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const isScheduled = !!getScheduledPuzzle(dateStr)
    const hasOverride = !!getDailyOverride(dateStr)
    const isToday = currentDate.getTime() === today.getTime()

    result.push({
      date: dateStr,
      dayName: currentDate.toLocaleDateString('en', { weekday: 'short' }),
      dayNum: currentDate.getDate(),
      month: currentDate.toLocaleDateString('en', { month: 'short' }),
      isToday,
      isPast: false,
      isScheduled,
      hasOverride,
      puzzle: getDailyPuzzle(dateStr)
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return result
})

function getPreviewColor(puzzle, row, col) {
  const value = puzzle.solution?.[row]?.[col] ?? 0
  if (value === 0) return 'transparent'
  return puzzle.color || '#06b6d4'
}
</script>

<template>
  <div class="scheduler force-light">
    <!-- Header -->
    <header class="scheduler-header">
      <button class="back-btn" @click="router.push('/creator')">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1>Daily Puzzle Calendar</h1>
    </header>

    <div class="scheduler-content">
      <p class="info-text">
        Daily puzzles are automatically generated based on the date.
        Each day gets a unique puzzle that's the same for all players.
      </p>

      <!-- Calendar grid -->
      <div class="calendar-grid">
        <div
          v-for="day in dates"
          :key="day.date"
          class="day-card clickable"
          :class="{
            today: day.isToday,
            scheduled: day.isScheduled,
            override: day.hasOverride
          }"
          @click="editPuzzle(day.date)"
        >
          <div class="day-header">
            <span class="day-name">{{ day.dayName }}</span>
            <span class="day-date">{{ day.month }} {{ day.dayNum }}</span>
          </div>

          <!-- Mini preview -->
          <div class="puzzle-preview">
            <div
              class="preview-grid"
              :style="{
                gridTemplateColumns: `repeat(${day.puzzle.size}, 1fr)`,
                gridTemplateRows: `repeat(${day.puzzle.size}, 1fr)`
              }"
            >
              <div
                v-for="r in day.puzzle.size"
                :key="`${day.date}-${r}`"
                class="preview-row"
              >
                <div
                  v-for="c in day.puzzle.size"
                  :key="`${day.date}-${r}-${c}`"
                  class="preview-cell"
                  :style="{ backgroundColor: getPreviewColor(day.puzzle, r-1, c-1) }"
                />
              </div>
            </div>
          </div>

          <div class="puzzle-name" :class="{ scheduled: day.isScheduled }">
            {{ day.puzzle.name }}
          </div>

          <div class="day-info">
            <span class="puzzle-size">{{ day.puzzle.size }}x{{ day.puzzle.size }}</span>
            <span class="puzzle-type" :class="{ scheduled: day.isScheduled, override: day.hasOverride }">
              {{ day.hasOverride ? 'Edited' : (day.isScheduled ? 'Scheduled' : 'Auto') }}
            </span>
          </div>

          <!-- Edit icon -->
          <div class="edit-icon">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="stats-note">
        <h3>Daily Puzzle Editor</h3>
        <p class="hint">
          Click any day to edit or create a puzzle. Changes are saved locally.
          Use the export button to copy code for dailyPuzzles.js.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scheduler {
  min-height: 100vh;
  background: linear-gradient(135deg, #fefce8 0%, #ecfeff 100%);
}

.scheduler-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #e5e7eb;
}

.scheduler-header h1 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #374151;
}

.back-btn {
  padding: 8px;
  border-radius: 8px;
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  cursor: pointer;
}

.scheduler-content {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}

.info-text {
  text-align: center;
  color: #6b7280;
  margin-bottom: 24px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 32px;
}

.day-card {
  background: white;
  border-radius: 12px;
  padding: 12px;
  border: 2px solid #e5e7eb;
  transition: all 0.15s ease;
}

.day-card.today {
  border-color: #06b6d4;
  background: #ecfeff;
}


.day-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.day-name {
  font-size: 0.75rem;
  font-weight: 700;
  color: #6b7280;
}

.day-date {
  font-size: 0.75rem;
  color: #9ca3af;
}

.puzzle-preview {
  aspect-ratio: 1;
  background: #f9fafb;
  border-radius: 6px;
  padding: 4px;
  margin-bottom: 8px;
}

.preview-grid {
  display: grid;
  gap: 1px;
  width: 100%;
  height: 100%;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.preview-row {
  display: contents;
}

.preview-cell {
  background: white;
}

.day-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
}

.puzzle-size {
  font-weight: 600;
  color: #374151;
}

.puzzle-type {
  color: #9ca3af;
}

.puzzle-type.scheduled {
  color: #22c55e;
  font-weight: 600;
}

.puzzle-name {
  font-size: 0.65rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.puzzle-name.scheduled {
  color: #374151;
  font-weight: 600;
}

.day-card.scheduled {
  border-color: #22c55e;
  background: #f0fdf4;
}

.day-card.override {
  border-color: #8b5cf6;
  background: #faf5ff;
}

.day-card.clickable {
  cursor: pointer;
  position: relative;
}

.day-card.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.1);
}

.day-card.clickable:hover .edit-icon {
  opacity: 1;
}

.edit-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  color: #6b7280;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.puzzle-type.override {
  color: #8b5cf6;
  font-weight: 600;
}

.stats-note {
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e5e7eb;
}

.stats-note h3 {
  font-weight: 700;
  color: #374151;
  margin-bottom: 12px;
}

.stats-note p {
  color: #6b7280;
  margin-bottom: 12px;
  line-height: 1.6;
}

.stats-note .hint {
  font-size: 0.875rem;
  color: #9ca3af;
  font-style: italic;
}
</style>
