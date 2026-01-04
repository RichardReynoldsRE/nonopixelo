// Puzzle data - all packs come from custom.js (synced from server)
// Use the Creator Dashboard to manage packs

import { customPacks } from './custom.js'

// Export customPacks as puzzlePacks for backward compatibility
export const puzzlePacks = customPacks

// Helper to check if an event pack is currently active
function isEventActive(pack) {
  if (!pack.isEvent) return true // Non-event packs are always active

  const now = new Date()

  // Check start date
  if (pack.eventStart) {
    const start = new Date(pack.eventStart)
    if (now < start) return false
  }

  // Check end date
  if (pack.eventEnd) {
    const end = new Date(pack.eventEnd)
    // Add 1 day to include the end date fully
    end.setDate(end.getDate() + 1)
    if (now > end) return false
  }

  return true
}

// Helper to get all packs as array
export function getAllPacks(includeInactive = false) {
  let allPacks = Object.values(customPacks)

  // Filter out unpublished and inactive event packs (unless includeInactive is true)
  if (!includeInactive) {
    allPacks = allPacks.filter(pack => {
      // Filter out unpublished packs
      if (pack.published === false) return false
      // Filter out inactive event packs
      if (!isEventActive(pack)) return false
      return true
    })
  }

  // Sort by order field from creator (packs without order go last)
  allPacks.sort((a, b) => {
    const orderA = a.order ?? 9999
    const orderB = b.order ?? 9999
    return orderA - orderB
  })

  return allPacks
}

// Helper to get a specific puzzle
export function getPuzzle(packId, puzzleId) {
  const pack = getPack(packId)
  if (!pack) return null
  return pack.puzzles.find(p => p.id === puzzleId)
}

// Helper to get pack by id
export function getPack(packId) {
  return customPacks[packId] || null
}
