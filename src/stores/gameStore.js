import { defineStore } from 'pinia'
import { ref, computed, triggerRef } from 'vue'

const MAX_MISTAKES = 3
const MAX_HINTS = 3

export const useGameStore = defineStore('game', () => {
  // Current puzzle state
  const currentPuzzle = ref(null)
  const playerGrid = ref([])
  const mistakes = ref(0)
  const hintsRemaining = ref(MAX_HINTS)
  const startTime = ref(null)
  const elapsedTime = ref(0)
  const isPlaying = ref(false)
  const isPaused = ref(false)
  const isCompleted = ref(false)
  const isGameOver = ref(false)

  // Current tool: 'fill' or 'mark'
  const currentTool = ref('fill')

  // Sound effect callback
  let onSoundEffect = null

  // Haptic feedback callback
  let onHapticEffect = null

  // Computed
  const gridSize = computed(() => currentPuzzle.value?.size || 5)

  const rowClues = computed(() => {
    if (!currentPuzzle.value) return []
    return currentPuzzle.value.solution.map(row => generateClues(row))
  })

  const colClues = computed(() => {
    if (!currentPuzzle.value) return []
    const cols = []
    for (let c = 0; c < gridSize.value; c++) {
      const col = currentPuzzle.value.solution.map(row => row[c])
      cols.push(generateClues(col))
    }
    return cols
  })

  // Check if a row has all required fills completed
  function checkRowComplete(rowIndex) {
    if (!currentPuzzle.value) return false
    const row = playerGrid.value[rowIndex]
    const solution = currentPuzzle.value.solution[rowIndex]

    // Check if all cells that should be filled ARE filled
    for (let c = 0; c < gridSize.value; c++) {
      if (solution[c] === 1 && row[c] !== 'filled') {
        return false
      }
    }
    return true
  }

  // Check if a column has all required fills completed
  function checkColComplete(colIndex) {
    if (!currentPuzzle.value) return false

    for (let r = 0; r < gridSize.value; r++) {
      if (currentPuzzle.value.solution[r][colIndex] === 1 &&
          playerGrid.value[r][colIndex] !== 'filled') {
        return false
      }
    }
    return true
  }

  const isRowCompleted = computed(() => {
    if (!currentPuzzle.value) return []
    return playerGrid.value.map((_, i) => checkRowComplete(i))
  })

  const isColCompleted = computed(() => {
    if (!currentPuzzle.value) return []
    const result = []
    for (let c = 0; c < gridSize.value; c++) {
      result.push(checkColComplete(c))
    }
    return result
  })

  // Helper functions
  function generateClues(line) {
    const clues = []
    let count = 0
    for (const cell of line) {
      if (cell === 1) {
        count++
      } else if (count > 0) {
        clues.push(count)
        count = 0
      }
    }
    if (count > 0) clues.push(count)
    return clues.length > 0 ? clues : [0]
  }

  // Set sound effect callback
  function setSoundCallback(callback) {
    onSoundEffect = callback
  }

  function playSound(type) {
    if (onSoundEffect) {
      onSoundEffect(type)
    }
  }

  // Set haptic feedback callback
  function setHapticCallback(callback) {
    onHapticEffect = callback
  }

  function playHaptic(type) {
    if (onHapticEffect) {
      onHapticEffect(type)
    }
  }

  // Trigger both sound and haptic feedback
  function playFeedback(type) {
    playSound(type)
    playHaptic(type)
  }

  // Auto-fill marks for completed rows/columns
  function autoFillMarks() {
    if (!currentPuzzle.value) return

    let changed = false
    const size = gridSize.value

    // Check each row - if all required fills are done, mark remaining empty cells
    for (let r = 0; r < size; r++) {
      if (checkRowComplete(r)) {
        for (let c = 0; c < size; c++) {
          if (playerGrid.value[r][c] === 'empty') {
            playerGrid.value[r][c] = 'marked'
            changed = true
          }
        }
      }
    }

    // Check each column - if all required fills are done, mark remaining empty cells
    for (let c = 0; c < size; c++) {
      if (checkColComplete(c)) {
        for (let r = 0; r < size; r++) {
          if (playerGrid.value[r][c] === 'empty') {
            playerGrid.value[r][c] = 'marked'
            changed = true
          }
        }
      }
    }

    if (changed) {
      playFeedback('automark')
      triggerRef(playerGrid)
    }
  }

  // Actions
  function loadPuzzle(puzzle) {
    currentPuzzle.value = puzzle
    playerGrid.value = Array(puzzle.size).fill(null).map(() =>
      Array(puzzle.size).fill('empty')
    )
    mistakes.value = 0
    hintsRemaining.value = MAX_HINTS
    startTime.value = Date.now()
    elapsedTime.value = 0
    isPlaying.value = true
    isPaused.value = false
    isCompleted.value = false
    isGameOver.value = false
  }

  function toggleCell(row, col) {
    if (!isPlaying.value || isPaused.value || isCompleted.value || isGameOver.value) return

    const current = playerGrid.value[row][col]

    // Can't change already filled cells
    if (current === 'filled') return
    // Can't change marked cells (they're permanent like fills)
    if (current === 'marked') return
    // Can't change wrong cells at all (they stay as permanent mistakes)
    if (current === 'wrong') return

    if (currentTool.value === 'fill') {
      // Check for mistakes (trying to fill a cell that should be empty)
      if (currentPuzzle.value.solution[row][col] !== 1) {
        mistakes.value++
        playFeedback('wrong')
        // Mark as wrong permanently - shows red X
        playerGrid.value[row][col] = 'wrong'
        triggerRef(playerGrid)

        // Check for game over (3 mistakes)
        if (mistakes.value >= MAX_MISTAKES) {
          isGameOver.value = true
          isPlaying.value = false
          playFeedback('gameover')
        }
        return
      }

      // Correct fill
      playerGrid.value[row][col] = 'filled'
      playFeedback('fill')
    } else {
      // Mark tool - trying to mark a cell
      // Check if it should be filled (wrong mark)
      if (currentPuzzle.value.solution[row][col] === 1) {
        // Wrong! This cell should be filled, not marked
        mistakes.value++
        playFeedback('wrong')
        // Fill it in since that's what it should be
        playerGrid.value[row][col] = 'filled'
        triggerRef(playerGrid)

        // Check for game over (3 mistakes)
        if (mistakes.value >= MAX_MISTAKES) {
          isGameOver.value = true
          isPlaying.value = false
          playFeedback('gameover')
        }

        // Auto-fill marks for completed rows/columns
        autoFillMarks()
        checkCompletion()
        return
      }
      // Correct mark - this cell should be empty
      playerGrid.value[row][col] = 'marked'
      playFeedback('mark')
    }

    triggerRef(playerGrid)

    // Auto-fill marks for completed rows/columns
    autoFillMarks()

    checkCompletion()
  }

  function setTool(tool) {
    currentTool.value = tool
  }

  function checkCompletion() {
    if (!currentPuzzle.value) return

    const allCorrect = playerGrid.value.every((row, r) =>
      row.every((cell, c) => {
        const shouldBeFilled = currentPuzzle.value.solution[r][c] === 1
        const isFilled = cell === 'filled'
        return shouldBeFilled === isFilled
      })
    )

    if (allCorrect) {
      isCompleted.value = true
      isPlaying.value = false
      elapsedTime.value = Date.now() - startTime.value
      playFeedback('win')
    }
  }

  function pause() {
    isPaused.value = true
  }

  function resume() {
    isPaused.value = false
  }

  function reset() {
    if (!currentPuzzle.value) return
    loadPuzzle(currentPuzzle.value)
  }

  function updateTime() {
    if (isPlaying.value && !isPaused.value && startTime.value) {
      elapsedTime.value = Date.now() - startTime.value
    }
  }

  // Calculate stars based on time and mistakes
  function calculateStars() {
    if (!currentPuzzle.value) return 0

    const size = currentPuzzle.value.size
    const baseTime = size * size * 1000 // 1 second per cell
    const timeRatio = elapsedTime.value / baseTime

    let stars = 3
    if (mistakes.value > 0) stars--
    if (mistakes.value > 3) stars--
    if (timeRatio > 2) stars--
    if (timeRatio > 4) stars--

    return Math.max(1, Math.min(3, stars))
  }

  // Use a hint to reveal one cell
  function useHint() {
    if (!currentPuzzle.value || hintsRemaining.value <= 0) return false
    if (!isPlaying.value || isPaused.value || isCompleted.value || isGameOver.value) return false

    const size = gridSize.value
    const solution = currentPuzzle.value.solution

    // Find all unsolved cells
    const unsolvedCells = []
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const current = playerGrid.value[row][col]
        if (current === 'empty') {
          unsolvedCells.push({ row, col, shouldFill: solution[row][col] === 1 })
        }
      }
    }

    if (unsolvedCells.length === 0) return false

    // Prioritize cells that should be filled (more helpful)
    const fillCells = unsolvedCells.filter(c => c.shouldFill)
    const targetCells = fillCells.length > 0 ? fillCells : unsolvedCells

    // Pick a random cell from the candidates
    const randomIndex = Math.floor(Math.random() * targetCells.length)
    const { row, col, shouldFill } = targetCells[randomIndex]

    // Apply the hint
    if (shouldFill) {
      playerGrid.value[row][col] = 'filled'
    } else {
      playerGrid.value[row][col] = 'marked'
    }

    hintsRemaining.value--
    playFeedback('hint')
    triggerRef(playerGrid)

    // Auto-fill marks for completed rows/columns
    autoFillMarks()
    checkCompletion()

    return { row, col }
  }

  return {
    // State
    currentPuzzle,
    playerGrid,
    mistakes,
    hintsRemaining,
    startTime,
    elapsedTime,
    isPlaying,
    isPaused,
    isCompleted,
    isGameOver,
    currentTool,
    maxMistakes: MAX_MISTAKES,
    maxHints: MAX_HINTS,
    // Computed
    gridSize,
    rowClues,
    colClues,
    isRowCompleted,
    isColCompleted,
    // Actions
    loadPuzzle,
    toggleCell,
    setTool,
    pause,
    resume,
    reset,
    updateTime,
    calculateStars,
    useHint,
    setSoundCallback,
    setHapticCallback
  }
})
