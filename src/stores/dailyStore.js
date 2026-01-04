import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'nonogram_daily'

export const useDailyStore = defineStore('daily', () => {
  // Completed daily challenges: { 'YYYY-MM-DD': { stars, time, mistakes } }
  const completedDailies = ref({})

  // Current streak
  const currentStreak = ref(0)
  const longestStreak = ref(0)
  const lastPlayedDate = ref(null)

  // Load from storage
  function loadDaily() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        completedDailies.value = data.completedDailies || {}
        currentStreak.value = data.currentStreak || 0
        longestStreak.value = data.longestStreak || 0
        lastPlayedDate.value = data.lastPlayedDate || null
      }
      updateStreak()
    } catch (e) {
      console.error('Failed to load daily progress:', e)
    }
  }

  // Save to storage
  function saveDaily() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        completedDailies: completedDailies.value,
        currentStreak: currentStreak.value,
        longestStreak: longestStreak.value,
        lastPlayedDate: lastPlayedDate.value
      }))
    } catch (e) {
      console.error('Failed to save daily progress:', e)
    }
  }

  // Get today's date string (using local timezone)
  function getTodayString() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Get yesterday's date string (using local timezone)
  function getYesterdayString() {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const year = yesterday.getFullYear()
    const month = String(yesterday.getMonth() + 1).padStart(2, '0')
    const day = String(yesterday.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Helper to format date as YYYY-MM-DD (local timezone)
  function formatDateString(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Update streak based on current date
  function updateStreak() {
    const today = getTodayString()
    const yesterday = getYesterdayString()

    if (lastPlayedDate.value === today) {
      // Already played today, streak is current
      return
    }

    if (lastPlayedDate.value === yesterday) {
      // Played yesterday, streak continues
      return
    }

    // Streak broken
    if (lastPlayedDate.value && lastPlayedDate.value !== yesterday) {
      currentStreak.value = 0
      saveDaily()
    }
  }

  // Complete today's challenge
  function completeDaily(stars, time, mistakes) {
    const today = getTodayString()
    const yesterday = getYesterdayString()

    // Only count if not already completed today
    if (!completedDailies.value[today]) {
      completedDailies.value[today] = { stars, time, mistakes }

      // Update streak
      if (lastPlayedDate.value === yesterday || !lastPlayedDate.value) {
        currentStreak.value++
      } else if (lastPlayedDate.value !== today) {
        currentStreak.value = 1
      }

      // Update longest streak
      if (currentStreak.value > longestStreak.value) {
        longestStreak.value = currentStreak.value
      }

      lastPlayedDate.value = today
      saveDaily()
    }
  }

  // Check if today's challenge is completed
  const isTodayCompleted = computed(() => {
    return !!completedDailies.value[getTodayString()]
  })

  // Get today's result
  const todayResult = computed(() => {
    return completedDailies.value[getTodayString()] || null
  })

  // Get last 7 days of calendar data
  const weekCalendar = computed(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = formatDateString(date)
      days.push({
        date: dateStr,
        dayName: date.toLocaleDateString('en', { weekday: 'short' }),
        dayNum: date.getDate(),
        completed: !!completedDailies.value[dateStr],
        stars: completedDailies.value[dateStr]?.stars || 0,
        isToday: i === 0
      })
    }
    return days
  })

  // Total daily challenges completed
  const totalDailiesCompleted = computed(() => {
    return Object.keys(completedDailies.value).length
  })

  // Generate daily puzzle seed from date
  function getDailySeed(dateStr = null) {
    const date = dateStr || getTodayString()
    // Simple hash function to generate seed from date
    let hash = 0
    for (let i = 0; i < date.length; i++) {
      const char = date.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  // Initialize
  loadDaily()

  return {
    completedDailies,
    currentStreak,
    longestStreak,
    lastPlayedDate,
    isTodayCompleted,
    todayResult,
    weekCalendar,
    totalDailiesCompleted,
    completeDaily,
    getDailySeed,
    getTodayString,
    updateStreak
  }
})
