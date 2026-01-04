import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useProgressStore } from './progressStore'
import { useDailyStore } from './dailyStore'

const STORAGE_KEY = 'nonogram_achievements'

// Achievement definitions
const ACHIEVEMENTS = [
  // Completion milestones
  { id: 'first_puzzle', name: 'First Steps', description: 'Complete your first puzzle', icon: '🎯', condition: (stats) => stats.totalPuzzles >= 1 },
  { id: 'puzzles_10', name: 'Getting Started', description: 'Complete 10 puzzles', icon: '📊', condition: (stats) => stats.totalPuzzles >= 10 },
  { id: 'puzzles_50', name: 'Puzzle Enthusiast', description: 'Complete 50 puzzles', icon: '🏆', condition: (stats) => stats.totalPuzzles >= 50 },
  { id: 'puzzles_100', name: 'Century', description: 'Complete 100 puzzles', icon: '💯', condition: (stats) => stats.totalPuzzles >= 100 },

  // Star achievements
  { id: 'stars_10', name: 'Rising Star', description: 'Earn 10 stars', icon: '⭐', condition: (stats) => stats.totalStars >= 10 },
  { id: 'stars_50', name: 'Star Collector', description: 'Earn 50 stars', icon: '🌟', condition: (stats) => stats.totalStars >= 50 },
  { id: 'stars_100', name: 'Constellation', description: 'Earn 100 stars', icon: '✨', condition: (stats) => stats.totalStars >= 100 },

  // Streak achievements
  { id: 'streak_3', name: 'On a Roll', description: 'Maintain a 3-day streak', icon: '🔥', condition: (stats) => stats.longestStreak >= 3 },
  { id: 'streak_7', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '📅', condition: (stats) => stats.longestStreak >= 7 },
  { id: 'streak_30', name: 'Monthly Master', description: 'Maintain a 30-day streak', icon: '🗓️', condition: (stats) => stats.longestStreak >= 30 },

  // Daily challenges
  { id: 'daily_1', name: 'Daily Debut', description: 'Complete your first daily challenge', icon: '📆', condition: (stats) => stats.totalDailies >= 1 },
  { id: 'daily_10', name: 'Daily Devotee', description: 'Complete 10 daily challenges', icon: '📰', condition: (stats) => stats.totalDailies >= 10 },

  // Skill achievements
  { id: 'perfect_3', name: 'Perfectionist', description: 'Get 3 stars on 3 puzzles', icon: '💎', condition: (stats) => stats.perfectPuzzles >= 3 },
  { id: 'perfect_10', name: 'Flawless', description: 'Get 3 stars on 10 puzzles', icon: '👑', condition: (stats) => stats.perfectPuzzles >= 10 },
  { id: 'no_mistakes', name: 'Sharp Mind', description: 'Complete a puzzle with no mistakes', icon: '🧠', condition: (stats) => stats.noMistakePuzzles >= 1 },

  // Size achievements
  { id: 'size_10', name: 'Growing Up', description: 'Complete a 10x10 puzzle', icon: '📐', condition: (stats) => stats.maxSize >= 10 },
  { id: 'size_15', name: 'Big Thinker', description: 'Complete a 15x15 puzzle', icon: '📏', condition: (stats) => stats.maxSize >= 15 },
  { id: 'size_20', name: 'Grandmaster', description: 'Complete a 20x20 puzzle', icon: '🎓', condition: (stats) => stats.maxSize >= 20 },
]

export const useAchievementStore = defineStore('achievements', () => {
  // Unlocked achievements
  const unlockedAchievements = ref([])

  // Stats tracking
  const stats = ref({
    totalPuzzles: 0,
    totalStars: 0,
    perfectPuzzles: 0,
    noMistakePuzzles: 0,
    maxSize: 5,
    totalTime: 0
  })

  // New achievement notification queue
  const newAchievements = ref([])

  // Load from storage
  function loadAchievements() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        unlockedAchievements.value = data.unlocked || []
        stats.value = { ...stats.value, ...data.stats }
      }
    } catch (e) {
      console.error('Failed to load achievements:', e)
    }
  }

  // Save to storage
  function saveAchievements() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        unlocked: unlockedAchievements.value,
        stats: stats.value
      }))
    } catch (e) {
      console.error('Failed to save achievements:', e)
    }
  }

  // Record puzzle completion
  function recordPuzzle(size, stars, mistakes, time) {
    stats.value.totalPuzzles++
    stats.value.totalStars += stars
    stats.value.totalTime += time

    if (stars === 3) {
      stats.value.perfectPuzzles++
    }

    if (mistakes === 0) {
      stats.value.noMistakePuzzles++
    }

    if (size > stats.value.maxSize) {
      stats.value.maxSize = size
    }

    checkAchievements()
    saveAchievements()
  }

  // Check and unlock achievements
  function checkAchievements() {
    const progressStore = useProgressStore()
    const dailyStore = useDailyStore()

    const checkStats = {
      ...stats.value,
      longestStreak: dailyStore.longestStreak,
      totalDailies: dailyStore.totalDailiesCompleted
    }

    for (const achievement of ACHIEVEMENTS) {
      if (!unlockedAchievements.value.includes(achievement.id)) {
        if (achievement.condition(checkStats)) {
          unlockedAchievements.value.push(achievement.id)
          newAchievements.value.push(achievement)
        }
      }
    }
  }

  // Get next unearned achievement to show
  function popNewAchievement() {
    return newAchievements.value.shift()
  }

  // Check if achievement is unlocked
  function isUnlocked(id) {
    return unlockedAchievements.value.includes(id)
  }

  // Get all achievements with unlock status
  const allAchievements = computed(() => {
    return ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: unlockedAchievements.value.includes(a.id)
    }))
  })

  // Get unlocked count
  const unlockedCount = computed(() => unlockedAchievements.value.length)
  const totalCount = computed(() => ACHIEVEMENTS.length)

  // Initialize
  loadAchievements()

  return {
    unlockedAchievements,
    stats,
    newAchievements,
    allAchievements,
    unlockedCount,
    totalCount,
    recordPuzzle,
    checkAchievements,
    popNewAchievement,
    isUnlocked,
    loadAchievements
  }
})
