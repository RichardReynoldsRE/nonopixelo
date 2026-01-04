import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'nonogram_tutorial'

// Tutorial puzzle - simple heart pattern
export const TUTORIAL_PUZZLE = {
  id: 'tutorial',
  name: 'Heart',
  size: 5,
  palette: ['#EF4444', '#DC2626'],
  solution: [
    [0, 1, 0, 1, 0],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0]
  ],
  revealImage: [
    [0, 1, 0, 1, 0],
    [1, 2, 1, 2, 1],
    [1, 2, 2, 2, 1],
    [0, 1, 2, 1, 0],
    [0, 0, 1, 0, 0]
  ]
}

// Tutorial steps - concise and focused
export const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome!',
    message: "Fill cells to reveal a hidden picture. Let's learn how!",
    target: null,
    action: 'next'
  },
  {
    id: 'explain-row-clues',
    title: 'Row Clues',
    message: "Numbers on the left show how many cells to fill in each row.",
    target: { type: 'row-clues' },
    action: 'next'
  },
  {
    id: 'explain-col-clues',
    title: 'Column Clues',
    message: "Numbers on top show how many cells to fill going down.",
    target: { type: 'col-clues' },
    action: 'next'
  },
  {
    id: 'fill-row-5',
    title: 'Try It!',
    message: "The highlighted row shows '5' — fill all 5 cells!",
    target: null,
    action: 'fill-row',
    requiredRow: 1
  },
  {
    id: 'fill-row-5-second',
    title: 'Great!',
    message: "This row is also '5'. Fill them all!",
    target: null,
    action: 'fill-row',
    requiredRow: 2
  },
  {
    id: 'explain-marks',
    title: 'Pro Tip',
    message: "Use the X tool below to mark cells you know are empty.",
    target: { type: 'controls' },
    action: 'next'
  },
  {
    id: 'free-play',
    title: 'Your Turn!',
    message: "Finish the puzzle! Use the clues to figure out the remaining cells.",
    target: null,
    action: 'complete'
  }
]

export const useTutorialStore = defineStore('tutorial', () => {
  const hasSeenWelcome = ref(false)
  const tutorialCompleted = ref(false)
  const isActive = ref(false)
  const currentStepIndex = ref(0)

  const currentStep = computed(() => {
    if (currentStepIndex.value >= TUTORIAL_STEPS.length) return null
    return TUTORIAL_STEPS[currentStepIndex.value]
  })

  const isLastStep = computed(() => {
    return currentStepIndex.value >= TUTORIAL_STEPS.length - 1
  })

  const progress = computed(() => {
    return {
      current: currentStepIndex.value + 1,
      total: TUTORIAL_STEPS.length
    }
  })

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        hasSeenWelcome.value = data.hasSeenWelcome ?? false
        tutorialCompleted.value = data.tutorialCompleted ?? false
      }
    } catch (e) {
      console.error('Failed to load tutorial state:', e)
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        hasSeenWelcome: hasSeenWelcome.value,
        tutorialCompleted: tutorialCompleted.value
      }))
    } catch (e) {
      console.error('Failed to save tutorial state:', e)
    }
  }

  function dismissWelcome() {
    hasSeenWelcome.value = true
    saveState()
  }

  function startTutorial() {
    hasSeenWelcome.value = true
    isActive.value = true
    currentStepIndex.value = 0
    saveState()
  }

  function nextStep() {
    if (currentStepIndex.value < TUTORIAL_STEPS.length - 1) {
      currentStepIndex.value++
    }
  }

  function completeTutorial() {
    isActive.value = false
    tutorialCompleted.value = true
    currentStepIndex.value = 0
    saveState()
  }

  function resetTutorial() {
    isActive.value = false
    currentStepIndex.value = 0
  }

  // Check if a row is fully filled (for step validation)
  function checkRowFilled(playerGrid, rowIndex) {
    const solution = TUTORIAL_PUZZLE.solution[rowIndex]
    const playerRow = playerGrid[rowIndex]

    for (let col = 0; col < solution.length; col++) {
      if (solution[col] === 1 && playerRow[col] !== 'filled') {
        return false
      }
    }
    return true
  }

  // Initialize
  loadState()

  return {
    // State
    hasSeenWelcome,
    tutorialCompleted,
    isActive,
    currentStepIndex,
    // Computed
    currentStep,
    isLastStep,
    progress,
    // Actions
    dismissWelcome,
    startTutorial,
    nextStep,
    completeTutorial,
    resetTutorial,
    checkRowFilled,
    // Constants
    TUTORIAL_PUZZLE,
    TUTORIAL_STEPS
  }
})
