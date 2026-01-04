<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProgressStore } from '@/stores/progressStore'
import { getPack } from '@/data/puzzles'
import StarRating from '@/components/ui/StarRating.vue'
import PuzzleReveal from '@/components/ui/PuzzleReveal.vue'

const router = useRouter()
const route = useRoute()
const progressStore = useProgressStore()

const packId = computed(() => route.params.packId)
const pack = computed(() => getPack(packId.value))

function getPuzzleStars(puzzleId) {
  const result = progressStore.getPuzzleResult(packId.value, puzzleId)
  return result?.stars || 0
}

function isCompleted(puzzleId) {
  return !!progressStore.getPuzzleResult(packId.value, puzzleId)
}
</script>

<template>
  <div class="pack-levels-view">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-8">
      <button
        class="p-2 rounded-xl bg-white dark:bg-slate-700 shadow-md hover:shadow-lg transition-shadow"
        @click="router.push('/levels')"
      >
        <span class="text-2xl">←</span>
      </button>
      <div>
        <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <span>{{ pack?.icon }}</span>
          {{ pack?.name }}
        </h1>
        <p class="text-gray-500 dark:text-gray-400">{{ pack?.description }}</p>
      </div>
    </div>

    <!-- Puzzle Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
      <div
        v-for="(puzzle, index) in pack?.puzzles"
        :key="puzzle.id"
        class="card cursor-pointer hover:shadow-2xl transition-all transform hover:scale-105 text-center"
        @click="router.push(`/play/${packId}/${puzzle.id}`)"
      >
        <!-- Puzzle Number -->
        <div class="text-sm font-bold text-gray-400 mb-1">
          #{{ index + 1 }}
        </div>

        <!-- Puzzle Preview (completed) or Placeholder (incomplete) -->
        <div class="flex justify-center mb-2">
          <PuzzleReveal
            v-if="isCompleted(puzzle.id)"
            :solution="puzzle.revealImage || puzzle.solution"
            :palette="puzzle.palette"
            :size="80"
            :animated="false"
          />
          <div v-else class="puzzle-placeholder">
            <span class="text-3xl">?</span>
          </div>
        </div>

        <!-- Puzzle Name (hidden until solved) -->
        <h3 class="font-bold text-gray-700 dark:text-gray-200 mb-1">
          {{ isCompleted(puzzle.id) ? puzzle.name : '???' }}
        </h3>

        <!-- Size -->
        <p class="text-sm text-gray-400 dark:text-gray-500 mb-2">{{ puzzle.size }}×{{ puzzle.size }}</p>

        <!-- Stars -->
        <div class="flex justify-center">
          <StarRating :stars="getPuzzleStars(puzzle.id)" size="sm" />
        </div>

        <!-- Completed checkmark -->
        <div
          v-if="isCompleted(puzzle.id)"
          class="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
        >
          <span class="text-white text-sm">✓</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pack-levels-view {
  min-height: 100vh;
  padding: 1.5rem;
  padding-bottom: 3rem;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-y;
}

.puzzle-placeholder {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #e5e7eb 25%, #d1d5db 25%, #d1d5db 50%, #e5e7eb 50%, #e5e7eb 75%, #d1d5db 75%);
  background-size: 8px 8px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.puzzle-placeholder span {
  background: white;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-weight: bold;
}

/* Dark mode */
:global(.dark) .puzzle-placeholder {
  background: linear-gradient(135deg, #334155 25%, #475569 25%, #475569 50%, #334155 50%, #334155 75%, #475569 75%);
}

:global(.dark) .puzzle-placeholder span {
  background: #1e293b;
  color: #64748b;
}
</style>
