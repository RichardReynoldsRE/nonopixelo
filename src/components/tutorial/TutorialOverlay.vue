<script setup>
import { watch, computed, ref } from 'vue'
import { useTutorialStore } from '@/stores/tutorialStore'
import { useGameStore } from '@/stores/gameStore'

const tutorialStore = useTutorialStore()
const gameStore = useGameStore()

const step = computed(() => tutorialStore.currentStep)
const progress = computed(() => tutorialStore.progress)
const hasAdvanced = ref(false)
const showCelebration = ref(false)

// Computed to check if the required row for current step is complete
const requiredRowComplete = computed(() => {
  if (!step.value || step.value.action !== 'fill-row') return false
  const rowIndex = step.value.requiredRow
  if (rowIndex === undefined) return false
  const completedRows = gameStore.isRowCompleted
  return completedRows.length > rowIndex && completedRows[rowIndex] === true
})

// Watch for row completion to auto-advance
watch(requiredRowComplete, (isComplete) => {
  if (isComplete && tutorialStore.isActive && !hasAdvanced.value) {
    hasAdvanced.value = true
    showCelebration.value = true

    setTimeout(() => {
      showCelebration.value = false
      tutorialStore.nextStep()
      hasAdvanced.value = false
    }, 800)
  }
})

function handleNext() {
  if (step.value?.action === 'complete') {
    tutorialStore.completeTutorial()
  } else {
    tutorialStore.nextStep()
  }
}

function handleSkip() {
  tutorialStore.completeTutorial()
}

// Get the icon for current step
const stepIcon = computed(() => {
  if (!step.value) return '📚'

  switch (step.value.id) {
    case 'welcome': return '👋'
    case 'explain-row-clues': return '👉'
    case 'explain-col-clues': return '👇'
    case 'fill-row-5': return '✏️'
    case 'fill-row-5-second': return '🎉'
    case 'explain-marks': return '💡'
    case 'free-play': return '🎮'
    default: return '💡'
  }
})

// Whether this step requires user interaction with the board
const isInteractiveStep = computed(() => {
  return step.value?.action === 'fill-row'
})
</script>

<template>
  <div v-if="tutorialStore.isActive && step" class="tutorial-wrapper">
    <!-- Instruction Panel - Fixed at top, outside game board -->
    <div class="tutorial-panel" :class="{ 'panel-interactive': isInteractiveStep }">
      <div class="panel-inner">
        <!-- Progress bar -->
        <div class="tutorial-progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${(progress.current / progress.total) * 100}%` }"
          ></div>
        </div>

        <div class="panel-content">
          <!-- Icon and step indicator -->
          <div class="step-icon-wrapper">
            <span class="step-icon" :class="{ 'animate-bounce-in': true }">{{ stepIcon }}</span>
            <span class="step-counter">{{ progress.current }}/{{ progress.total }}</span>
          </div>

          <!-- Message area -->
          <div class="message-area">
            <h3 v-if="step.title && !isInteractiveStep" class="step-title">{{ step.title }}</h3>
            <p class="step-message">{{ step.message }}</p>
          </div>

          <!-- Action area -->
          <div class="action-area">
            <!-- Interactive steps: show status -->
            <template v-if="isInteractiveStep">
              <div v-if="!requiredRowComplete" class="action-hint">
                <span class="hint-icon animate-pulse-soft">👆</span>
                <span class="hint-text">Tap the cells!</span>
              </div>
              <button
                v-else
                class="btn-tutorial-next animate-pop"
                @click="handleNext"
              >
                Continue
              </button>
            </template>

            <!-- Non-interactive: show next button -->
            <template v-else>
              <button
                class="btn-tutorial-next"
                @click="handleNext"
              >
                {{ step.action === 'complete' ? "Let's Go!" : 'Got it!' }}
              </button>
            </template>

            <!-- Skip button -->
            <button class="btn-skip" @click="handleSkip">
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Celebration overlay when row completed -->
    <div v-if="showCelebration" class="celebration-flash"></div>
  </div>
</template>

<style scoped>
.tutorial-wrapper {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 100;
}

/* Instruction panel below floating buttons */
.tutorial-panel {
  position: fixed;
  top: max(76px, calc(env(safe-area-inset-top) + 68px));
  left: 0;
  right: 0;
  pointer-events: auto;
  z-index: 105;
  padding: 0 12px;
}

.panel-inner {
  background: white;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  animation: slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Progress bar at very top */
.tutorial-progress-bar {
  height: 4px;
  background: #e5e7eb;
}

.tutorial-progress-bar .progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #06b6d4, #22d3ee);
  transition: width 0.4s ease;
}

.panel-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
}

/* Step icon */
.step-icon-wrapper {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.step-icon {
  font-size: 2rem;
  line-height: 1;
}

.step-counter {
  font-size: 0.65rem;
  font-weight: 700;
  color: #06b6d4;
  background: #ecfeff;
  padding: 2px 6px;
  border-radius: 8px;
}

/* Message area */
.message-area {
  flex: 1;
  min-width: 0;
}

.step-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 2px 0;
}

.step-message {
  font-size: 0.8rem;
  color: #475569;
  margin: 0;
  line-height: 1.4;
}

/* Action area */
.action-area {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.btn-tutorial-next {
  padding: 8px 16px;
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  color: white;
  font-size: 0.8rem;
  font-weight: 700;
  border-radius: 12px;
  white-space: nowrap;
  transition: all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  box-shadow: 0 2px 8px rgba(6, 182, 212, 0.3);
}

.btn-tutorial-next:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
}

.btn-tutorial-next:active {
  transform: scale(0.98);
}

.btn-skip {
  padding: 4px 8px;
  color: #94a3b8;
  font-size: 0.7rem;
  font-weight: 500;
  transition: color 0.2s;
}

.btn-skip:hover {
  color: #64748b;
}

/* Action hint for interactive steps */
.action-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #fef3c7;
  border-radius: 12px;
}

.hint-icon {
  font-size: 1rem;
}

.hint-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #92400e;
}

/* Celebration flash */
.celebration-flash {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at center, rgba(34, 211, 238, 0.3) 0%, transparent 70%);
  animation: celebrationFlash 0.6s ease-out forwards;
  pointer-events: none;
  z-index: 110;
}

@keyframes celebrationFlash {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.2);
  }
}

/* Interactive panel style (slightly different when user needs to act) */
.panel-interactive .panel-inner {
  border: 2px solid #06b6d4;
}

/* Responsive adjustments */
@media (max-width: 400px) {
  .panel-content {
    padding: 10px 12px;
    gap: 10px;
  }

  .step-icon {
    font-size: 1.5rem;
  }

  .step-message {
    font-size: 0.75rem;
  }

  .btn-tutorial-next {
    padding: 6px 12px;
    font-size: 0.75rem;
  }
}
</style>

<style>
/* Dark mode */
.dark .panel-inner {
  background: #1e293b;
}

.dark .tutorial-progress-bar {
  background: #334155;
}

.dark .step-title {
  color: #f1f5f9;
}

.dark .step-message {
  color: #94a3b8;
}

.dark .step-counter {
  background: #164e63;
  color: #22d3ee;
}

.dark .action-hint {
  background: #422006;
}

.dark .hint-text {
  color: #fbbf24;
}

.dark .pointer-label {
  background: #1e293b;
  color: #22d3ee;
}

.dark .btn-skip {
  color: #64748b;
}

.dark .btn-skip:hover {
  color: #94a3b8;
}
</style>
