import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'nonogram_settings'

export const useSettingsStore = defineStore('settings', () => {
  // Settings
  const soundEnabled = ref(true)
  const hapticEnabled = ref(true)
  const showTimer = ref(true)
  const showMistakes = ref(true)
  const highlightCompleted = ref(true)
  const autoMarkX = ref(false)
  const darkMode = ref(false)

  // Load from storage
  function loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        soundEnabled.value = data.soundEnabled ?? true
        hapticEnabled.value = data.hapticEnabled ?? true
        showTimer.value = data.showTimer ?? true
        showMistakes.value = data.showMistakes ?? true
        highlightCompleted.value = data.highlightCompleted ?? true
        autoMarkX.value = data.autoMarkX ?? false
        darkMode.value = data.darkMode ?? false
      }
    } catch (e) {
      console.error('Failed to load settings:', e)
    }
  }

  // Save to storage
  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        soundEnabled: soundEnabled.value,
        hapticEnabled: hapticEnabled.value,
        showTimer: showTimer.value,
        showMistakes: showMistakes.value,
        highlightCompleted: highlightCompleted.value,
        autoMarkX: autoMarkX.value,
        darkMode: darkMode.value
      }))
    } catch (e) {
      console.error('Failed to save settings:', e)
    }
  }

  // Watch for changes and auto-save
  watch(
    [soundEnabled, hapticEnabled, showTimer, showMistakes, highlightCompleted, autoMarkX, darkMode],
    () => saveSettings(),
    { deep: true }
  )

  // Apply dark mode class to document
  watch(darkMode, (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, { immediate: true })

  // Initialize
  loadSettings()

  return {
    soundEnabled,
    hapticEnabled,
    showTimer,
    showMistakes,
    highlightCompleted,
    autoMarkX,
    darkMode,
    loadSettings,
    saveSettings
  }
})
