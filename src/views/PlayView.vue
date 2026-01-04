<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { useProgressStore } from '@/stores/progressStore'
import { useAchievementStore } from '@/stores/achievementStore'
import { useTutorialStore, TUTORIAL_PUZZLE } from '@/stores/tutorialStore'
import { getPuzzle } from '@/data/puzzles'
import { useSounds } from '@/composables/useSounds'
import { useHaptics } from '@/composables/useHaptics'
import GameBoard from '@/components/game/GameBoard.vue'
import GameControls from '@/components/game/GameControls.vue'
import Modal from '@/components/ui/Modal.vue'
import StarRating from '@/components/ui/StarRating.vue'
import Confetti from '@/components/ui/Confetti.vue'
import PuzzleReveal from '@/components/ui/PuzzleReveal.vue'
import TutorialOverlay from '@/components/tutorial/TutorialOverlay.vue'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()
const progressStore = useProgressStore()
const achievementStore = useAchievementStore()
const tutorialStore = useTutorialStore()
const { handleSound } = useSounds()
const { handleHaptic } = useHaptics()

const showWinModal = ref(false)
const showGameOverModal = ref(false)
const earnedStars = ref(0)
const encouragingMessage = ref('')

// Encouraging messages based on performance
const encouragingMessages = {
  perfect: ['Perfect!', 'Flawless!', 'Amazing!', 'Incredible!'],
  great: ['Great job!', 'Well done!', 'Excellent!', 'Fantastic!'],
  good: ['Nice work!', 'Good job!', 'Keep it up!', 'Way to go!']
}

function getEncouragingMessage(stars, mistakes) {
  let pool
  if (mistakes === 0 && stars === 3) {
    pool = encouragingMessages.perfect
  } else if (stars >= 2) {
    pool = encouragingMessages.great
  } else {
    pool = encouragingMessages.good
  }
  return pool[Math.floor(Math.random() * pool.length)]
}

const packId = computed(() => route.params.packId)
const puzzleId = computed(() => route.params.puzzleId)
const isTutorial = computed(() => packId.value === 'tutorial')

// Get puzzle - use tutorial puzzle if in tutorial mode
const puzzle = computed(() => {
  if (isTutorial.value) {
    return TUTORIAL_PUZZLE
  }
  return getPuzzle(packId.value, puzzleId.value)
})
const puzzleColor = computed(() => puzzle.value?.color || '#06B6D4')

// Check if puzzle was previously completed (to show/hide name)
const hasCompletedBefore = computed(() => {
  if (isTutorial.value) return false
  return !!progressStore.getPuzzleResult(packId.value, puzzleId.value)
})

// Display name - show "???" if first playthrough to avoid spoilers
const displayName = computed(() => {
  if (hasCompletedBefore.value || gameStore.isComplete) {
    return puzzle.value?.name
  }
  return '???'
})

onMounted(() => {
  // Set up sound and haptic callbacks
  gameStore.setSoundCallback(handleSound)
  gameStore.setHapticCallback(handleHaptic)

  if (puzzle.value) {
    gameStore.loadPuzzle(puzzle.value)
  }
})

// Watch for puzzle changes (handles late route param resolution)
watch(puzzle, (newPuzzle) => {
  if (newPuzzle && !gameStore.currentPuzzle) {
    gameStore.loadPuzzle(newPuzzle)
  }
}, { immediate: true })

// Watch for completion
watch(() => gameStore.isCompleted, (completed) => {
  if (completed) {
    earnedStars.value = gameStore.calculateStars()

    if (isTutorial.value) {
      // Mark tutorial as complete
      tutorialStore.completeTutorial()

      // Also mark the first puzzle (heart) in Getting Started pack as complete
      // since the tutorial puzzle is the same as the heart puzzle
      // Use getting_started (custom pack) since it overrides the built-in starter
      progressStore.completePuzzle(
        'getting_started',
        'heart',
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
    } else {
      // Save progress for regular puzzles
      progressStore.completePuzzle(
        packId.value,
        puzzleId.value,
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
    }

    // Set encouraging message
    encouragingMessage.value = getEncouragingMessage(earnedStars.value, gameStore.mistakes)

    // Show modal with delay for dramatic effect
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

function goToNextPuzzle() {
  if (isTutorial.value) {
    // After tutorial, go to level selection
    router.push('/levels')
  } else {
    router.push(`/levels/${packId.value}`)
  }
}

// Reset tutorial if user leaves during tutorial
onUnmounted(() => {
  if (tutorialStore.isActive) {
    tutorialStore.resetTutorial()
  }
})

function retry() {
  showGameOverModal.value = false
  gameStore.reset()
}
</script>

<template>
  <div class="game-view">
    <!-- Game Board - Centered in viewport -->
    <div class="board-container">
      <GameBoard />
    </div>

    <!-- Floating Back Button - Top Left -->
    <div class="floating-top-left">
      <button
        class="floating-button"
        @click="isTutorial ? router.push('/') : router.push(`/levels/${packId}`)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </div>

    <!-- Floating Title - Top Center (hidden on small screens) -->
    <div class="floating-top-center hidden sm:block">
      <div class="floating-card px-6 py-2 text-center">
        <h1 class="text-lg font-bold text-gray-800 dark:text-gray-100">{{ displayName }}</h1>
        <p class="text-xs text-gray-500 dark:text-gray-400">{{ puzzle?.size }}x{{ puzzle?.size }}</p>
      </div>
    </div>

    <!-- Floating Hearts - Top Right -->
    <div class="floating-top-right">
      <div class="floating-card px-3 py-2 flex gap-1 items-center">
        <span
          v-for="i in gameStore.maxMistakes"
          :key="i"
          class="text-lg leading-none transition-transform duration-200"
          :class="{
            'heart-pulse': gameStore.mistakes === gameStore.maxMistakes - 1 && i > gameStore.mistakes,
            'scale-0 opacity-0': i <= gameStore.mistakes
          }"
          :style="{ transitionDelay: i <= gameStore.mistakes ? '0ms' : `${i * 50}ms` }"
        >
          {{ i <= gameStore.mistakes ? '💔' : '❤️' }}
        </span>
      </div>
    </div>

    <!-- Floating Controls - Bottom Center -->
    <div class="floating-bottom-center">
      <GameControls />
    </div>

    <!-- Win Modal -->
    <Modal :show="showWinModal" :closable="false">
      <div class="text-center win-modal-content">
        <!-- Tutorial complete banner -->
        <div v-if="isTutorial" class="mb-4 py-2 px-4 bg-success-100 text-success-700 rounded-xl font-bold animate-slide-up">
          Tutorial Complete!
        </div>

        <!-- Encouraging message -->
        <div class="encourage-message mb-2">
          <span class="text-3xl font-extrabold text-gradient">{{ encouragingMessage }}</span>
        </div>

        <h2 class="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">{{ puzzle?.name }}</h2>

        <div class="flex justify-center mb-5 puzzle-reveal-container">
          <PuzzleReveal
            v-if="puzzle?.solution"
            :solution="puzzle.revealImage || puzzle.solution"
            :palette="puzzle.palette"
            :color="puzzleColor"
            :size="140"
          />
        </div>

        <div class="flex justify-center mb-5 stars-container">
          <StarRating :stars="earnedStars" size="lg" animated />
        </div>

        <div class="stats-row flex justify-center gap-6 mb-6">
          <div class="stat-item text-center px-4 py-2 rounded-xl bg-primary-50 dark:bg-slate-700">
            <div class="text-xl font-extrabold text-primary-600 dark:text-primary-400 number-display">{{ formatTime(gameStore.elapsedTime) }}</div>
            <div class="text-xs font-semibold text-primary-500 dark:text-primary-300 uppercase tracking-wide">Time</div>
          </div>
          <div class="stat-item text-center px-4 py-2 rounded-xl" :class="gameStore.mistakes === 0 ? 'bg-success-50' : 'bg-coral-50 dark:bg-slate-700'">
            <div class="text-xl font-extrabold number-display" :class="gameStore.mistakes === 0 ? 'text-success-600' : 'text-coral-600 dark:text-coral-400'">{{ gameStore.mistakes }}</div>
            <div class="text-xs font-semibold uppercase tracking-wide" :class="gameStore.mistakes === 0 ? 'text-success-500' : 'text-coral-500 dark:text-coral-300'">Mistakes</div>
          </div>
        </div>

        <div class="flex flex-col gap-3 buttons-container">
          <button
            class="btn-success w-full"
            @click="goToNextPuzzle()"
          >
            {{ isTutorial ? 'Start Playing!' : 'Continue' }}
          </button>
          <button
            class="btn-secondary w-full"
            @click="gameStore.reset(); showWinModal = false"
          >
            Play Again
          </button>
        </div>
      </div>
    </Modal>

    <!-- Game Over Modal -->
    <Modal :show="showGameOverModal" :closable="false">
      <div class="text-center gameover-modal-content">
        <div class="text-5xl mb-3 animate-bounce-in">😔</div>
        <h2 class="text-2xl font-extrabold text-gray-800 dark:text-gray-100 mb-2">Don't give up!</h2>
        <p class="text-gray-500 dark:text-gray-400 mb-5">Every puzzle master makes mistakes</p>

        <div class="flex justify-center gap-2 mb-6">
          <span
            v-for="i in gameStore.maxMistakes"
            :key="i"
            class="text-2xl animate-bounce-in"
            :style="{ animationDelay: `${i * 100}ms` }"
          >
            💔
          </span>
        </div>

        <div class="flex flex-col gap-3">
          <button
            class="btn-primary w-full"
            @click="retry()"
          >
            Try Again
          </button>
          <button
            class="btn-ghost w-full text-gray-500"
            @click="router.push(`/levels/${packId}`)"
          >
            Back to Levels
          </button>
        </div>
      </div>
    </Modal>

    <!-- Confetti -->
    <Confetti :active="showWinModal" />

    <!-- Tutorial Overlay -->
    <TutorialOverlay v-if="isTutorial" />
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
  padding: 60px 16px 100px 16px;
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
    z-index: 110;
  }

  .floating-top-center {
    top: max(16px, env(safe-area-inset-top));
    z-index: 110;
  }

  .floating-top-right {
    top: max(16px, env(safe-area-inset-top));
    right: max(16px, env(safe-area-inset-right));
    z-index: 110;
  }

  .floating-bottom-center {
    bottom: max(16px, env(safe-area-inset-bottom));
    z-index: 110;
  }

  .board-container {
    padding-top: max(60px, calc(env(safe-area-inset-top) + 50px));
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
