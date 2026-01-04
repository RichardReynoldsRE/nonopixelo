import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getAllPacks } from '@/data/puzzles'

const STORAGE_KEY = 'nonogram_progress'

export const useProgressStore = defineStore('progress', () => {
  // Completed puzzles: { packId: { puzzleId: { stars, time, mistakes } } }
  const completedPuzzles = ref({})

  // Unlocked packs
  const unlockedPacks = ref([])

  // Load from storage
  function loadProgress() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        completedPuzzles.value = data.completedPuzzles || {}
        unlockedPacks.value = data.unlockedPacks || []
      }
      // Always ensure first packs are unlocked
      ensureInitialUnlocks()
    } catch (e) {
      console.error('Failed to load progress:', e)
    }
  }

  // Ensure packs that should be unlocked by default are unlocked
  function ensureInitialUnlocks() {
    const packs = getAllPacks()
    for (const pack of packs) {
      // Unlock if no requirements or unlockType is 'always'
      if (!pack.unlockType || pack.unlockType === 'always') {
        if (!unlockedPacks.value.includes(pack.id)) {
          unlockedPacks.value.push(pack.id)
        }
      }
    }
  }

  // Save to storage
  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        completedPuzzles: completedPuzzles.value,
        unlockedPacks: unlockedPacks.value
      }))
    } catch (e) {
      console.error('Failed to save progress:', e)
    }
  }

  // Mark puzzle as completed
  function completePuzzle(packId, puzzleId, stars, time, mistakes) {
    if (!completedPuzzles.value[packId]) {
      completedPuzzles.value[packId] = {}
    }

    const existing = completedPuzzles.value[packId][puzzleId]

    // Only update if new result is better
    if (!existing || stars > existing.stars) {
      completedPuzzles.value[packId][puzzleId] = { stars, time, mistakes }
    }

    checkAllUnlocks()
    saveProgress()
  }

  // Check all packs for unlock conditions
  function checkAllUnlocks() {
    const packs = getAllPacks()

    for (const pack of packs) {
      if (unlockedPacks.value.includes(pack.id)) continue

      if (checkPackUnlockCondition(pack)) {
        unlockedPacks.value.push(pack.id)
      }
    }
  }

  // Check if a specific pack's unlock condition is met
  function checkPackUnlockCondition(pack) {
    // No unlock requirement = always unlocked
    if (!pack.unlockType || pack.unlockType === 'always') {
      return true
    }

    // Requires completing puzzles from a specific pack
    if (pack.unlockType === 'after_pack' && pack.unlockRequirement) {
      const requiredPackId = pack.unlockRequirement.packId
      const requiredCount = pack.unlockRequirement.puzzleCount || 1
      const packProgress = completedPuzzles.value[requiredPackId] || {}
      return Object.keys(packProgress).length >= requiredCount
    }

    // Requires completing any X puzzles total
    if (pack.unlockType === 'total_puzzles' && pack.unlockRequirement) {
      const requiredCount = pack.unlockRequirement.puzzleCount || 1
      return totalCompleted.value >= requiredCount
    }

    return true
  }

  // Get unlock requirement info for display
  function getUnlockRequirement(packId) {
    const packs = getAllPacks()
    const pack = packs.find(p => p.id === packId)
    if (!pack) return null

    if (!pack.unlockType || pack.unlockType === 'always') {
      return null // No requirement
    }

    if (pack.unlockType === 'after_pack' && pack.unlockRequirement) {
      const requiredPack = packs.find(p => p.id === pack.unlockRequirement.packId)
      const requiredCount = pack.unlockRequirement.puzzleCount || 1
      const currentProgress = Object.keys(completedPuzzles.value[pack.unlockRequirement.packId] || {}).length

      return {
        type: 'after_pack',
        requiredPackId: pack.unlockRequirement.packId,
        requiredPackName: requiredPack?.name || pack.unlockRequirement.packId,
        requiredPackIcon: requiredPack?.icon || '📦',
        requiredCount,
        currentCount: currentProgress,
        isComplete: currentProgress >= requiredCount
      }
    }

    if (pack.unlockType === 'total_puzzles' && pack.unlockRequirement) {
      const requiredCount = pack.unlockRequirement.puzzleCount || 1
      return {
        type: 'total_puzzles',
        requiredCount,
        currentCount: totalCompleted.value,
        isComplete: totalCompleted.value >= requiredCount
      }
    }

    return null
  }

  // Get progress for a specific pack
  function getPackProgress(packId) {
    return completedPuzzles.value[packId] || {}
  }

  // Get puzzle result
  function getPuzzleResult(packId, puzzleId) {
    return completedPuzzles.value[packId]?.[puzzleId] || null
  }

  // Check if pack is unlocked
  function isPackUnlocked(packId) {
    return unlockedPacks.value.includes(packId)
  }

  // Get total stars for a pack
  const getPackStars = (packId) => {
    const pack = completedPuzzles.value[packId] || {}
    return Object.values(pack).reduce((sum, p) => sum + (p.stars || 0), 0)
  }

  // Get total completed puzzles
  const totalCompleted = computed(() => {
    return Object.values(completedPuzzles.value).reduce((sum, pack) =>
      sum + Object.keys(pack).length, 0
    )
  })

  // Get total stars
  const totalStars = computed(() => {
    return Object.values(completedPuzzles.value).reduce((sum, pack) =>
      sum + Object.values(pack).reduce((s, p) => s + (p.stars || 0), 0), 0
    )
  })

  // Initialize
  loadProgress()

  return {
    completedPuzzles,
    unlockedPacks,
    totalCompleted,
    totalStars,
    completePuzzle,
    getPackProgress,
    getPuzzleResult,
    isPackUnlocked,
    getPackStars,
    getUnlockRequirement,
    loadProgress,
    saveProgress
  }
})
