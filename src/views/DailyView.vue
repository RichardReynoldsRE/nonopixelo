<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { useDailyStore } from '@/stores/dailyStore'
import { useAchievementStore } from '@/stores/achievementStore'
import { getDailyPuzzle } from '@/composables/usePuzzleGenerator'
import { useSounds } from '@/composables/useSounds'
import { useHaptics } from '@/composables/useHaptics'
import GameBoard from '@/components/game/GameBoard.vue'
import GameControls from '@/components/game/GameControls.vue'
import Modal from '@/components/ui/Modal.vue'
import StarRating from '@/components/ui/StarRating.vue'
import Confetti from '@/components/ui/Confetti.vue'
import PuzzleReveal from '@/components/ui/PuzzleReveal.vue'

const router = useRouter()
const gameStore = useGameStore()
const dailyStore = useDailyStore()
const achievementStore = useAchievementStore()
const { handleSound } = useSounds()
const { handleHaptic } = useHaptics()

const showWinModal = ref(false)
const showGameOverModal = ref(false)
const showAlreadyCompleted = ref(false)
const earnedStars = ref(0)

const dailyPuzzle = computed(() => getDailyPuzzle())

onMounted(() => {
  // Set up sound and haptic callbacks
  gameStore.setSoundCallback(handleSound)
  gameStore.setHapticCallback(handleHaptic)

  if (dailyStore.isTodayCompleted) {
    showAlreadyCompleted.value = true
  } else if (dailyPuzzle.value) {
    gameStore.loadPuzzle(dailyPuzzle.value)
  }
})

// Ensure puzzle loads even if computed is slow
watch(dailyPuzzle, (puzzle) => {
  if (puzzle && !gameStore.currentPuzzle && !dailyStore.isTodayCompleted) {
    gameStore.loadPuzzle(puzzle)
  }
}, { immediate: true })

// Watch for completion
watch(() => gameStore.isCompleted, (completed) => {
  if (completed && !dailyStore.isTodayCompleted) {
    earnedStars.value = gameStore.calculateStars()

    // Save daily progress
    dailyStore.completeDaily(
      earnedStars.value,
      gameStore.elapsedTime,
      gameStore.mistakes
    )

    // Record for achievements
    achievementStore.recordPuzzle(
      gameStore.gridSize,
      earnedStars.value,
      gameStore.mistakes,
      gameStore.elapsedTime
    )

    setTimeout(() => {
      showWinModal.value = true
    }, 500)
  }
})

// Watch for game over
watch(() => gameStore.isGameOver, (gameOver) => {
  if (gameOver) {
    setTimeout(() => {
      showGameOverModal.value = true
    }, 500)
  }
})

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000)
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function playAnyway() {
  showAlreadyCompleted.value = false
  gameStore.loadPuzzle(dailyPuzzle.value)
}

function retry() {
  showGameOverModal.value = false
  gameStore.reset()
}
</script>

<template>
  <div class="game-view">
    <!-- Game Board - Centered in viewport -->
    <div v-if="!showAlreadyCompleted" class="board-container">
      <GameBoard />
    </div>

    <!-- Floating Back Button - Top Left -->
    <div class="floating-top-left">
      <button
        class="floating-button"
        @click="router.push('/')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </div>

    <!-- Floating Title & Calendar - Top Center -->
    <div class="floating-top-center">
      <div class="floating-card px-4 py-2">
        <h1 class="text-center text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Daily Challenge</h1>

        <!-- Week Calendar -->
        <div class="flex gap-1">
          <div
            v-for="day in dailyStore.weekCalendar"
            :key="day.date"
            class="flex flex-col items-center"
          >
            <span class="text-[10px] text-gray-400">{{ day.dayName }}</span>
            <div
              class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
              :class="{
                'bg-green-500 text-white': day.completed,
                'bg-coral-500 text-white ring-2 ring-coral-300': day.isToday && !day.completed,
                'bg-gray-100 dark:bg-slate-600 text-gray-400': !day.completed && !day.isToday
              }"
            >
              {{ day.dayNum }}
            </div>
          </div>
        </div>

        <!-- Current Streak -->
        <div v-if="dailyStore.currentStreak > 0" class="text-center mt-2">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-coral-100 dark:bg-coral-900 text-coral-600 dark:text-coral-400 rounded-full font-bold text-xs">
            🔥 {{ dailyStore.currentStreak }} day streak!
          </span>
        </div>
      </div>
    </div>

    <!-- Floating Hearts - Top Right -->
    <div class="floating-top-right">
      <div class="floating-card px-3 py-2 flex gap-1">
        <span
          v-for="i in gameStore.maxMistakes"
          :key="i"
          class="text-lg leading-none"
        >
          {{ i <= gameStore.mistakes ? '💔' : '❤️' }}
        </span>
      </div>
    </div>

    <!-- Floating Controls - Bottom Center -->
    <div v-if="!showAlreadyCompleted" class="floating-bottom-center">
      <GameControls />
    </div>

    <!-- Already Completed Modal -->
    <Modal :show="showAlreadyCompleted" @close="router.push('/')">
      <div class="text-center">
        <div class="text-6xl mb-4">✅</div>
        <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Already Completed!</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-4">You've already completed today's challenge.</p>

        <div class="flex justify-center mb-6">
          <StarRating :stars="dailyStore.todayResult?.stars || 0" size="lg" />
        </div>

        <p class="text-gray-500 dark:text-gray-400 mb-6">Come back tomorrow for a new puzzle!</p>

        <div class="flex flex-col gap-3">
          <button class="btn-primary w-full" @click="router.push('/')">
            Back to Home
          </button>
          <button class="btn-secondary w-full" @click="playAnyway">
            Play Again (for fun)
          </button>
        </div>
      </div>
    </Modal>

    <!-- Win Modal -->
    <Modal :show="showWinModal" :closable="false">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Daily Complete!</h2>

        <div class="flex justify-center mb-4">
          <PuzzleReveal
            v-if="dailyPuzzle?.solution"
            :solution="dailyPuzzle.revealImage || dailyPuzzle.solution"
            :palette="dailyPuzzle.palette"
            :color="dailyPuzzle.color || '#06B6D4'"
            :size="160"
          />
        </div>

        <div class="flex justify-center mb-4">
          <StarRating :stars="earnedStars" size="lg" animated />
        </div>

        <div class="flex justify-center gap-8 mb-6 text-gray-600 dark:text-gray-300">
          <div class="text-center">
            <div class="text-2xl font-bold">{{ formatTime(gameStore.elapsedTime) }}</div>
            <div class="text-sm">Time</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold">{{ gameStore.mistakes }}</div>
            <div class="text-sm">Mistakes</div>
          </div>
        </div>

        <div v-if="dailyStore.currentStreak > 1" class="mb-6 p-4 bg-coral-50 dark:bg-coral-900/30 rounded-xl">
          <span class="text-2xl">🔥</span>
          <p class="font-bold text-coral-600 dark:text-coral-400">{{ dailyStore.currentStreak }} Day Streak!</p>
        </div>

        <button class="btn-primary w-full" @click="router.push('/')">
          Back to Home
        </button>
      </div>
    </Modal>

    <!-- Game Over Modal -->
    <Modal :show="showGameOverModal" :closable="false">
      <div class="text-center">
        <div class="text-6xl mb-4">😢</div>
        <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Game Over!</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-6">You made {{ gameStore.maxMistakes }} mistakes</p>

        <div class="flex justify-center gap-2 mb-8">
          <span v-for="i in gameStore.maxMistakes" :key="i" class="text-3xl">💔</span>
        </div>

        <div class="flex flex-col gap-3">
          <button
            class="btn-primary w-full"
            @click="retry()"
          >
            Try Again
          </button>
          <button
            class="btn-secondary w-full"
            @click="router.push('/')"
          >
            Back to Home
          </button>
        </div>
      </div>
    </Modal>

    <Confetti :active="showWinModal" />
  </div>
</template>

<style scoped>
.game-view {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, #fefce8 0%, #ecfeff 100%);
  overflow: hidden;
}

.board-container {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 120px 16px 100px 16px;
}

.floating-top-left {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 110;
}

.floating-top-center {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 110;
}

.floating-top-right {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 110;
}

.floating-bottom-center {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 110;
}

.floating-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.floating-button {
  padding: 12px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  color: #374151;
  transition: all 0.2s;
}

.floating-button:hover {
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  transform: translateY(-1px);
}


/* Safe area support for notched devices */
@supports (padding: max(0px)) {
  .floating-top-left {
    top: max(16px, env(safe-area-inset-top));
    left: max(16px, env(safe-area-inset-left));
  }

  .floating-top-center {
    top: max(16px, env(safe-area-inset-top));
  }

  .floating-top-right {
    top: max(16px, env(safe-area-inset-top));
    right: max(16px, env(safe-area-inset-right));
  }

  .floating-bottom-center {
    bottom: max(16px, env(safe-area-inset-bottom));
  }

  .board-container {
    padding-top: max(120px, calc(env(safe-area-inset-top) + 110px));
    padding-bottom: max(100px, calc(env(safe-area-inset-bottom) + 80px));
  }
}
</style>

<style>
/* Dark mode - unscoped for proper specificity */
.dark .game-view {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
}

.dark .floating-card {
  background: rgba(30, 41, 59, 0.9);
  color: #e2e8f0;
}

.dark .floating-button {
  background: rgba(30, 41, 59, 0.9);
  color: #e2e8f0;
}
</style>
