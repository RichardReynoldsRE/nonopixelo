<script setup>
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useTutorialStore } from '@/stores/tutorialStore'

const gameStore = useGameStore()
const settingsStore = useSettingsStore()
const tutorialStore = useTutorialStore()

// Check if controls should be highlighted
const highlightControls = computed(() => {
  if (!tutorialStore.isActive) return false
  return tutorialStore.currentStep?.target?.type === 'controls'
})

// Format time as MM:SS
function formatTime(ms) {
  const seconds = Math.floor(ms / 1000)
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="floating-controls" :class="{ 'tutorial-highlight-controls': highlightControls }">
    <!-- Tool Selection -->
    <div class="flex gap-2">
      <button
        class="tool-button"
        :class="{ active: gameStore.currentTool === 'fill' }"
        @click="gameStore.setTool('fill')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 11h-6V5a1 1 0 0 0-2 0v6H5a1 1 0 0 0 0 2h6v6a1 1 0 0 0 2 0v-6h6a1 1 0 0 0 0-2z"/>
        </svg>
        <span class="hidden sm:inline">Fill</span>
      </button>
      <button
        class="tool-button"
        :class="{ active: gameStore.currentTool === 'mark' }"
        @click="gameStore.setTool('mark')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span class="hidden sm:inline">Mark</span>
      </button>
    </div>

    <!-- Divider -->
    <div class="w-px h-8 bg-gray-200 dark:bg-slate-600"></div>

    <!-- Timer -->
    <div v-if="settingsStore.showTimer" class="timer">
      {{ formatTime(gameStore.elapsedTime) }}
    </div>

    <!-- Hint Button -->
    <button
      class="hint-button"
      :class="{ disabled: gameStore.hintsRemaining <= 0 }"
      :disabled="gameStore.hintsRemaining <= 0"
      @click="gameStore.useHint()"
      title="Use Hint"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
      <span class="hint-count">{{ gameStore.hintsRemaining }}</span>
    </button>

    <!-- Reset Button -->
    <button
      class="reset-button"
      @click="gameStore.reset()"
      title="Reset Puzzle"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.floating-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-radius: 20px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  transition: box-shadow 0.3s ease;
}

.tutorial-highlight-controls {
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.5), 0 4px 20px rgba(6, 182, 212, 0.3);
  animation: controls-pulse 1.2s ease-in-out infinite;
}

@keyframes controls-pulse {
  0%, 100% {
    box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.5), 0 4px 20px rgba(6, 182, 212, 0.3);
  }
  50% {
    box-shadow: 0 0 0 5px rgba(6, 182, 212, 0.6), 0 4px 24px rgba(6, 182, 212, 0.4);
  }
}

.tool-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.875rem;
  color: #6b7280;
  background: #f3f4f6;
  transition: all 0.15s ease;
}

.tool-button:hover {
  background: #e5e7eb;
}

.tool-button.active {
  background: #06b6d4;
  color: white;
  box-shadow: 0 2px 8px rgb(6 182 212 / 0.4);
}

.timer {
  font-family: ui-monospace, monospace;
  font-size: 1.125rem;
  font-weight: 700;
  color: #374151;
  min-width: 60px;
  text-align: center;
}

.reset-button {
  padding: 8px;
  border-radius: 10px;
  color: #9ca3af;
  transition: all 0.15s ease;
}

.reset-button:hover {
  background: #f3f4f6;
  color: #6b7280;
}

.hint-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 10px;
  background: #fef3c7;
  color: #d97706;
  transition: all 0.15s ease;
}

.hint-button:hover:not(.disabled) {
  background: #fde68a;
  color: #b45309;
}

.hint-button.disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.hint-count {
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 1rem;
  text-align: center;
}

/* Responsive adjustments */
@media (max-width: 400px) {
  .floating-controls {
    padding: 8px 12px;
    gap: 8px;
  }

  .tool-button {
    padding: 10px 12px;
  }

  .timer {
    font-size: 1rem;
    min-width: 50px;
  }
}

</style>

<style>
/* Dark mode - unscoped to work with .dark on html */
.dark .floating-controls {
  background: rgba(30, 41, 59, 0.95);
}

.dark .tool-button {
  color: #94a3b8;
  background: #334155;
}

.dark .tool-button:hover {
  background: #475569;
}

.dark .tool-button.active {
  background: #06b6d4;
  color: white;
}

.dark .timer {
  color: #e2e8f0;
}

.dark .reset-button {
  color: #64748b;
}

.dark .reset-button:hover {
  background: #334155;
  color: #94a3b8;
}

.dark .hint-button.disabled {
  background: #334155;
  color: #64748b;
}
</style>
