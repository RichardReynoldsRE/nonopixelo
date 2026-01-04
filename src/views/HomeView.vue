<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProgressStore } from '@/stores/progressStore'
import { useDailyStore } from '@/stores/dailyStore'
import { useTutorialStore } from '@/stores/tutorialStore'
import Modal from '@/components/ui/Modal.vue'

const router = useRouter()
const progressStore = useProgressStore()
const dailyStore = useDailyStore()
const tutorialStore = useTutorialStore()

// Check if running in native app (hide creator mode on mobile)
const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform()

const showAnimation = ref(false)

onMounted(() => {
  // Trigger entrance animations
  setTimeout(() => showAnimation.value = true, 100)
})

// Show welcome for brand new users who haven't seen it
const showWelcome = computed(() => {
  return progressStore.totalCompleted === 0 && !tutorialStore.hasSeenWelcome
})

// Fun greeting based on time of day
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning!'
  if (hour < 18) return 'Good afternoon!'
  return 'Good evening!'
})

// Streak milestone celebration
const isStreakMilestone = computed(() => {
  return dailyStore.currentStreak > 0 && dailyStore.currentStreak % 7 === 0
})

function startTutorial() {
  tutorialStore.startTutorial()
  router.push('/play/tutorial/tutorial')
}

function skipTutorial() {
  tutorialStore.dismissWelcome()
}

function openHowToPlay() {
  tutorialStore.startTutorial()
  router.push('/play/tutorial/tutorial')
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden">
    <!-- Logo & Title -->
    <div
      class="text-center mb-8 transition-all duration-500"
      :class="showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
    >
      <div class="relative inline-block">
        <img
          src="/icons/icon-192.webp"
          alt="Nonopixelo"
          class="w-24 h-24 mx-auto mb-4 rounded-3xl shadow-xl hover-lift cursor-pointer"
          @click="router.push('/levels')"
        />
        <!-- Subtle glow behind logo -->
        <div class="absolute inset-0 bg-primary-400/20 rounded-3xl blur-xl -z-10 scale-110"></div>
      </div>
      <h1 class="text-4xl font-extrabold text-gradient mb-1">
        Nonopixelo
      </h1>
      <p class="text-gray-500 dark:text-gray-400 font-medium">Picture Puzzle Game</p>
    </div>

    <!-- Stats Cards -->
    <div
      class="flex gap-4 mb-8 transition-all duration-500 delay-100"
      :class="showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
    >
      <div class="stat-card bg-primary-50 dark:bg-slate-800 min-w-[80px]">
        <div class="text-2xl font-extrabold text-primary-600 dark:text-primary-400 number-display">
          {{ progressStore.totalCompleted }}
        </div>
        <div class="text-xs font-semibold text-primary-500 dark:text-primary-300 uppercase tracking-wide">Puzzles</div>
      </div>
      <div class="stat-card bg-yellow-50 dark:bg-slate-800 min-w-[80px]">
        <div class="text-2xl font-extrabold text-yellow-600 dark:text-yellow-400 number-display flex items-center justify-center gap-1">
          {{ progressStore.totalStars }} <span class="text-lg">⭐</span>
        </div>
        <div class="text-xs font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">Stars</div>
      </div>
      <div
        class="stat-card min-w-[80px]"
        :class="dailyStore.currentStreak > 0 ? 'bg-coral-50 dark:bg-slate-800' : 'bg-gray-50 dark:bg-slate-800'"
      >
        <div
          class="text-2xl font-extrabold number-display flex items-center justify-center gap-1"
          :class="dailyStore.currentStreak > 0 ? 'text-coral-500' : 'text-gray-400'"
        >
          {{ dailyStore.currentStreak }}
          <span v-if="dailyStore.currentStreak > 0" class="text-lg" :class="{ 'animate-pulse-soft': isStreakMilestone }">🔥</span>
        </div>
        <div class="text-xs font-semibold uppercase tracking-wide" :class="dailyStore.currentStreak > 0 ? 'text-coral-500' : 'text-gray-400'">Streak</div>
      </div>
    </div>

    <!-- Main Menu Buttons -->
    <div
      class="flex flex-col gap-3 w-full max-w-xs transition-all duration-500 delay-200"
      :class="showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
    >
      <button
        class="btn-primary text-lg py-4 flex items-center justify-center gap-3"
        @click="router.push('/levels')"
      >
        <span class="text-2xl">🎮</span>
        <span>Play</span>
      </button>

      <button
        class="btn-coral text-lg py-4 relative flex items-center justify-center gap-3 overflow-visible"
        @click="router.push('/daily')"
      >
        <span class="text-2xl">📅</span>
        <span>Daily Challenge</span>
        <span
          v-if="!dailyStore.isTodayCompleted"
          class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold animate-bounce z-10"
        >
          !
        </span>
      </button>

      <button
        class="btn-secondary text-lg py-4 flex items-center justify-center gap-3"
        @click="router.push('/achievements')"
      >
        <span class="text-2xl">🏆</span>
        <span>Achievements</span>
      </button>

      <button
        class="btn-secondary text-lg py-4 flex items-center justify-center gap-3"
        @click="router.push('/settings')"
      >
        <span class="text-2xl">⚙️</span>
        <span>Settings</span>
      </button>
    </div>

    <!-- Streak Celebration -->
    <div
      v-if="dailyStore.currentStreak >= 3"
      class="mt-8 text-center transition-all duration-500 delay-300"
      :class="showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
    >
      <div class="inline-flex items-center gap-2 px-4 py-2 bg-coral-50 dark:bg-slate-800 rounded-full">
        <span class="text-xl" :class="{ 'animate-wiggle': isStreakMilestone }">🔥</span>
        <span class="font-bold text-coral-600 dark:text-coral-400">
          {{ dailyStore.currentStreak }} day streak!
        </span>
        <span v-if="isStreakMilestone" class="text-xl">🎉</span>
      </div>
      <p v-if="!dailyStore.isTodayCompleted" class="text-sm text-gray-500 mt-2">
        Complete today's puzzle to keep it going!
      </p>
    </div>

    <!-- How to Play button (for returning users) -->
    <button
      v-if="!showWelcome"
      class="mt-6 text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-all flex items-center gap-2 press-effect"
      :class="showAnimation ? 'opacity-100' : 'opacity-0'"
      @click="openHowToPlay"
    >
      <span class="text-lg">❓</span>
      <span class="text-sm font-medium">How to Play</span>
    </button>

    <!-- Creator Mode Link (hidden on native mobile app) -->
    <button
      v-if="!isNative"
      class="mt-4 text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 transition-all text-xs"
      :class="showAnimation ? 'opacity-100' : 'opacity-0'"
      @click="router.push('/creator')"
    >
      Creator Mode
    </button>

    <!-- Welcome Modal for new users -->
    <Modal :show="showWelcome" :closable="false">
      <div class="text-center">
        <div class="text-5xl mb-3 animate-bounce-in">👋</div>
        <h2 class="text-2xl font-extrabold text-gray-800 dark:text-gray-100 mb-1">Welcome!</h2>
        <p class="text-gray-500 dark:text-gray-400 mb-4">
          Nonopixelo is a picture puzzle game where you fill cells to reveal hidden images.
        </p>

        <div class="bg-primary-50 dark:bg-slate-700 rounded-xl p-4 mb-6">
          <p class="text-sm text-primary-700 dark:text-primary-300">
            Would you like a quick tutorial?<br/>
            <span class="text-xs text-primary-500">Takes less than 2 minutes</span>
          </p>
        </div>

        <div class="flex flex-col gap-3">
          <button
            class="btn-success w-full"
            @click="startTutorial"
          >
            Learn to Play
          </button>
          <button
            class="btn-ghost w-full text-gray-500"
            @click="skipTutorial"
          >
            I already know how
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
/* Prevent layout shift during animation */
.min-h-screen {
  min-height: 100dvh;
}
</style>
