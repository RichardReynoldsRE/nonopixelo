<script setup>
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settingsStore'
import { useProgressStore } from '@/stores/progressStore'
import { useTutorialStore } from '@/stores/tutorialStore'

const router = useRouter()
const settingsStore = useSettingsStore()
const progressStore = useProgressStore()
const tutorialStore = useTutorialStore()

function replayTutorial() {
  tutorialStore.startTutorial()
  router.push('/play/tutorial/tutorial')
}

function clearProgress() {
  if (confirm('Are you sure you want to clear all progress? This cannot be undone.')) {
    localStorage.clear()
    location.reload()
  }
}
</script>

<template>
  <div class="min-h-screen p-6">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-8">
      <button
        class="p-2 rounded-xl bg-white dark:bg-slate-700 shadow-md hover:shadow-lg transition-shadow"
        @click="router.push('/')"
      >
        <span class="text-2xl">←</span>
      </button>
      <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100">Settings</h1>
    </div>

    <!-- Appearance Section -->
    <div class="mb-8">
      <h2 class="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">Appearance</h2>
      <div class="space-y-3">
        <!-- Dark Mode -->
        <div class="card flex items-center justify-between">
          <div>
            <h3 class="font-bold text-gray-800 dark:text-gray-100">Dark Mode</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Switch to dark theme</p>
          </div>
          <button
            class="w-14 h-8 rounded-full transition-colors"
            :class="settingsStore.darkMode ? 'bg-primary-500' : 'bg-gray-300 dark:bg-slate-600'"
            @click="settingsStore.darkMode = !settingsStore.darkMode"
          >
            <div
              class="w-6 h-6 bg-white rounded-full shadow-md transition-transform mx-1"
              :class="settingsStore.darkMode ? 'translate-x-6' : 'translate-x-0'"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Gameplay Section -->
    <div class="mb-8">
      <h2 class="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">Gameplay</h2>
      <div class="space-y-3">
        <!-- Highlight Completed -->
        <div class="card flex items-center justify-between">
          <div>
            <h3 class="font-bold text-gray-800 dark:text-gray-100">Highlight Completed</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Dim clues for completed rows/columns</p>
          </div>
          <button
            class="w-14 h-8 rounded-full transition-colors"
            :class="settingsStore.highlightCompleted ? 'bg-primary-500' : 'bg-gray-300 dark:bg-slate-600'"
            @click="settingsStore.highlightCompleted = !settingsStore.highlightCompleted"
          >
            <div
              class="w-6 h-6 bg-white rounded-full shadow-md transition-transform mx-1"
              :class="settingsStore.highlightCompleted ? 'translate-x-6' : 'translate-x-0'"
            />
          </button>
        </div>

        <!-- Timer -->
        <div class="card flex items-center justify-between">
          <div>
            <h3 class="font-bold text-gray-800 dark:text-gray-100">Show Timer</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Display elapsed time during puzzles</p>
          </div>
          <button
            class="w-14 h-8 rounded-full transition-colors"
            :class="settingsStore.showTimer ? 'bg-primary-500' : 'bg-gray-300 dark:bg-slate-600'"
            @click="settingsStore.showTimer = !settingsStore.showTimer"
          >
            <div
              class="w-6 h-6 bg-white rounded-full shadow-md transition-transform mx-1"
              :class="settingsStore.showTimer ? 'translate-x-6' : 'translate-x-0'"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Feedback Section -->
    <div class="mb-8">
      <h2 class="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">Feedback</h2>
      <div class="space-y-3">
        <!-- Sound -->
        <div class="card flex items-center justify-between">
          <div>
            <h3 class="font-bold text-gray-800 dark:text-gray-100">Sound Effects</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Play sounds when completing actions</p>
          </div>
          <button
            class="w-14 h-8 rounded-full transition-colors"
            :class="settingsStore.soundEnabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-slate-600'"
            @click="settingsStore.soundEnabled = !settingsStore.soundEnabled"
          >
            <div
              class="w-6 h-6 bg-white rounded-full shadow-md transition-transform mx-1"
              :class="settingsStore.soundEnabled ? 'translate-x-6' : 'translate-x-0'"
            />
          </button>
        </div>

        <!-- Haptics -->
        <div class="card flex items-center justify-between">
          <div>
            <h3 class="font-bold text-gray-800 dark:text-gray-100">Haptic Feedback</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Vibrate on cell interactions</p>
          </div>
          <button
            class="w-14 h-8 rounded-full transition-colors"
            :class="settingsStore.hapticEnabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-slate-600'"
            @click="settingsStore.hapticEnabled = !settingsStore.hapticEnabled"
          >
            <div
              class="w-6 h-6 bg-white rounded-full shadow-md transition-transform mx-1"
              :class="settingsStore.hapticEnabled ? 'translate-x-6' : 'translate-x-0'"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Help Section -->
    <div class="mb-8">
      <h2 class="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">Help</h2>
      <div class="space-y-3">
        <button
          class="card w-full flex items-center gap-4 text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          @click="replayTutorial"
        >
          <span class="text-2xl">📖</span>
          <div>
            <h3 class="font-bold text-gray-800 dark:text-gray-100">How to Play</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Replay the tutorial</p>
          </div>
        </button>
      </div>
    </div>

    <!-- Stats Section -->
    <div class="mb-8">
      <h2 class="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">Your Stats</h2>
      <div class="card">
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <div class="text-2xl font-bold text-primary-600">{{ progressStore.totalCompleted }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Puzzles</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-yellow-500">{{ progressStore.totalStars }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Stars</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-coral-500">{{ Math.round((progressStore.totalStars / Math.max(progressStore.totalCompleted * 3, 1)) * 100) }}%</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Perfection</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="mb-8">
      <h2 class="text-sm font-bold text-red-400 uppercase tracking-wide mb-3">Danger Zone</h2>
      <button
        class="w-full py-3 rounded-xl border-2 border-red-300 dark:border-red-500 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
        @click="clearProgress"
      >
        Clear All Progress
      </button>
    </div>

    <!-- About -->
    <div class="text-center text-gray-400 text-sm pb-8">
      <p class="font-medium">Nonopixelo v1.0.0</p>
      <p class="mt-2">A picture puzzle game</p>
      <p class="mt-1">Made with ❤️</p>
    </div>
  </div>
</template>
