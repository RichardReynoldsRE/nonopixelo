<script setup>
import { useRouter } from 'vue-router'
import { useAchievementStore } from '@/stores/achievementStore'
import ProgressBar from '@/components/ui/ProgressBar.vue'

const router = useRouter()
const achievementStore = useAchievementStore()
</script>

<template>
  <div class="min-h-screen p-6">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <button
        class="p-2 rounded-xl bg-white dark:bg-slate-700 shadow-md hover:shadow-lg transition-shadow"
        @click="router.push('/')"
      >
        <span class="text-2xl">←</span>
      </button>
      <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100">Achievements</h1>
    </div>

    <!-- Progress Summary -->
    <div class="card mb-6">
      <div class="flex items-center justify-between mb-4">
        <span class="text-gray-600 dark:text-gray-400 font-medium">Progress</span>
        <span class="text-primary-600 dark:text-primary-400 font-bold">
          {{ achievementStore.unlockedCount }} / {{ achievementStore.totalCount }}
        </span>
      </div>
      <ProgressBar
        :value="achievementStore.unlockedCount"
        :max="achievementStore.totalCount"
      />
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div class="card text-center">
        <div class="text-3xl font-bold text-primary-600 dark:text-primary-400">
          {{ achievementStore.stats.totalPuzzles }}
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">Puzzles Solved</div>
      </div>
      <div class="card text-center">
        <div class="text-3xl font-bold text-coral-500 dark:text-coral-400">
          {{ achievementStore.stats.totalStars }}
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">Stars Earned</div>
      </div>
      <div class="card text-center">
        <div class="text-3xl font-bold text-green-500 dark:text-green-400">
          {{ achievementStore.stats.perfectPuzzles }}
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">Perfect Puzzles</div>
      </div>
      <div class="card text-center">
        <div class="text-3xl font-bold text-purple-500 dark:text-purple-400">
          {{ achievementStore.stats.maxSize }}x{{ achievementStore.stats.maxSize }}
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">Largest Solved</div>
      </div>
    </div>

    <!-- Achievement List -->
    <div class="space-y-3">
      <div
        v-for="achievement in achievementStore.allAchievements"
        :key="achievement.id"
        class="card flex items-center gap-4"
        :class="{ 'opacity-50': !achievement.unlocked }"
      >
        <div
          class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
          :class="achievement.unlocked ? 'bg-primary-100 dark:bg-primary-900' : 'bg-gray-100 dark:bg-slate-700'"
        >
          {{ achievement.unlocked ? achievement.icon : '🔒' }}
        </div>
        <div class="flex-1">
          <h3 class="font-bold text-gray-800 dark:text-gray-100">{{ achievement.name }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ achievement.description }}</p>
        </div>
        <div v-if="achievement.unlocked" class="text-green-500 text-xl">✓</div>
      </div>
    </div>
  </div>
</template>
