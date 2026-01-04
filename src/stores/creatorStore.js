import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useCreatorStore = defineStore('creator', () => {
  // Sync state
  const isOnline = ref(false)
  const isSyncing = ref(false)
  const lastSyncError = ref(null)
  // Packs state
  const packs = ref([])
  const currentPack = ref(null)
  const currentPuzzle = ref(null)

  // Editor state
  const currentTool = ref('pencil') // pencil, eraser, fill, line, rect
  const currentLayer = ref('solution') // solution, reveal
  const currentColorIndex = ref(1) // 0 = empty, 1+ = palette colors
  const palette = ref(['#06B6D4', '#0891B2']) // Default cyan palette
  const gridSize = ref(10)
  const zoom = ref(100)

  // Canvas state
  const solutionGrid = ref([])
  const revealGrid = ref([])

  // Undo/Redo
  const undoStack = ref([])
  const redoStack = ref([])
  const maxUndoLevels = 50

  // Computed
  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  const filledCellCount = computed(() => {
    let count = 0
    for (const row of solutionGrid.value) {
      for (const cell of row) {
        if (cell === 1) count++
      }
    }
    return count
  })

  const totalCells = computed(() => gridSize.value * gridSize.value)

  const fillPercentage = computed(() => {
    if (totalCells.value === 0) return 0
    return Math.round((filledCellCount.value / totalCells.value) * 100)
  })

  // Generate clues from solution
  const rowClues = computed(() => {
    return solutionGrid.value.map(row => generateClues(row))
  })

  const colClues = computed(() => {
    const clues = []
    for (let c = 0; c < gridSize.value; c++) {
      const col = solutionGrid.value.map(row => row[c])
      clues.push(generateClues(col))
    }
    return clues
  })

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

  // Actions
  function initializeGrids(size) {
    gridSize.value = size
    solutionGrid.value = Array(size).fill(null).map(() => Array(size).fill(0))
    revealGrid.value = Array(size).fill(null).map(() => Array(size).fill(0))
    undoStack.value = []
    redoStack.value = []
  }

  function saveState() {
    const state = {
      solution: JSON.parse(JSON.stringify(solutionGrid.value)),
      reveal: JSON.parse(JSON.stringify(revealGrid.value))
    }
    undoStack.value.push(state)
    if (undoStack.value.length > maxUndoLevels) {
      undoStack.value.shift()
    }
    redoStack.value = []
  }

  function undo() {
    if (!canUndo.value) return
    const currentState = {
      solution: JSON.parse(JSON.stringify(solutionGrid.value)),
      reveal: JSON.parse(JSON.stringify(revealGrid.value))
    }
    redoStack.value.push(currentState)
    const prevState = undoStack.value.pop()
    solutionGrid.value = prevState.solution
    revealGrid.value = prevState.reveal
  }

  function redo() {
    if (!canRedo.value) return
    const currentState = {
      solution: JSON.parse(JSON.stringify(solutionGrid.value)),
      reveal: JSON.parse(JSON.stringify(revealGrid.value))
    }
    undoStack.value.push(currentState)
    const nextState = redoStack.value.pop()
    solutionGrid.value = nextState.solution
    revealGrid.value = nextState.reveal
  }

  function setCell(row, col, value) {
    if (currentLayer.value === 'solution') {
      solutionGrid.value[row][col] = value
      // Auto-sync reveal if setting solution
      if (value === 1 && revealGrid.value[row][col] === 0) {
        revealGrid.value[row][col] = currentColorIndex.value
      } else if (value === 0) {
        revealGrid.value[row][col] = 0
      }
    } else {
      // Only set reveal if solution cell is filled
      if (solutionGrid.value[row][col] === 1) {
        revealGrid.value[row][col] = value
      }
    }
  }

  function floodFill(startRow, startCol, newValue) {
    const grid = currentLayer.value === 'solution' ? solutionGrid.value : revealGrid.value
    const originalValue = grid[startRow][startCol]
    if (originalValue === newValue) return

    const stack = [[startRow, startCol]]
    const visited = new Set()

    while (stack.length > 0) {
      const [r, c] = stack.pop()
      const key = `${r},${c}`

      if (visited.has(key)) continue
      if (r < 0 || r >= gridSize.value || c < 0 || c >= gridSize.value) continue
      if (grid[r][c] !== originalValue) continue

      visited.add(key)
      setCell(r, c, newValue)

      stack.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1])
    }
  }

  function drawLine(r1, c1, r2, c2, value) {
    // Bresenham's line algorithm
    const dx = Math.abs(c2 - c1)
    const dy = Math.abs(r2 - r1)
    const sx = c1 < c2 ? 1 : -1
    const sy = r1 < r2 ? 1 : -1
    let err = dx - dy

    let r = r1
    let c = c1

    while (true) {
      setCell(r, c, value)
      if (r === r2 && c === c2) break
      const e2 = 2 * err
      if (e2 > -dy) { err -= dy; c += sx }
      if (e2 < dx) { err += dx; r += sy }
    }
  }

  function drawRect(r1, c1, r2, c2, value, filled = false) {
    const minR = Math.min(r1, r2)
    const maxR = Math.max(r1, r2)
    const minC = Math.min(c1, c2)
    const maxC = Math.max(c1, c2)

    if (filled) {
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          setCell(r, c, value)
        }
      }
    } else {
      // Top and bottom edges
      for (let c = minC; c <= maxC; c++) {
        setCell(minR, c, value)
        setCell(maxR, c, value)
      }
      // Left and right edges
      for (let r = minR; r <= maxR; r++) {
        setCell(r, minC, value)
        setCell(r, maxC, value)
      }
    }
  }

  function clearGrid() {
    saveState()
    solutionGrid.value = Array(gridSize.value).fill(null).map(() => Array(gridSize.value).fill(0))
    revealGrid.value = Array(gridSize.value).fill(null).map(() => Array(gridSize.value).fill(0))
  }

  function resizeGrid(newSize) {
    saveState()
    const oldSolution = solutionGrid.value
    const oldReveal = revealGrid.value
    const oldSize = gridSize.value

    gridSize.value = newSize
    solutionGrid.value = Array(newSize).fill(null).map(() => Array(newSize).fill(0))
    revealGrid.value = Array(newSize).fill(null).map(() => Array(newSize).fill(0))

    // Copy over existing data
    const copySize = Math.min(oldSize, newSize)
    for (let r = 0; r < copySize; r++) {
      for (let c = 0; c < copySize; c++) {
        solutionGrid.value[r][c] = oldSolution[r][c]
        revealGrid.value[r][c] = oldReveal[r][c]
      }
    }
  }

  function addColor(color) {
    if (palette.value.length < 8) {
      palette.value.push(color)
    }
  }

  function removeColor(index) {
    if (palette.value.length > 1 && index > 0) {
      palette.value.splice(index, 1)
      // Adjust reveal grid colors
      for (let r = 0; r < gridSize.value; r++) {
        for (let c = 0; c < gridSize.value; c++) {
          if (revealGrid.value[r][c] > index) {
            revealGrid.value[r][c]--
          } else if (revealGrid.value[r][c] === index) {
            revealGrid.value[r][c] = 1 // Reset to first color
          }
        }
      }
    }
  }

  function updateColor(index, color) {
    if (index >= 0 && index < palette.value.length) {
      palette.value[index] = color
    }
  }

  // Pack management
  function loadPacks(packsData) {
    packs.value = packsData
  }

  function createPack(packData) {
    const newPack = {
      id: `pack_${Date.now()}`,
      name: packData.name || 'New Pack',
      description: packData.description || '',
      icon: packData.icon || '📦',
      color: packData.color || 'primary',
      published: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      puzzles: []
    }
    packs.value.push(newPack)
    return newPack
  }

  function loadPuzzle(puzzle) {
    currentPuzzle.value = puzzle
    gridSize.value = puzzle.size
    solutionGrid.value = JSON.parse(JSON.stringify(puzzle.solution))
    palette.value = puzzle.palette ? [...puzzle.palette] : ['#06B6D4', '#0891B2']
    revealGrid.value = puzzle.revealImage
      ? JSON.parse(JSON.stringify(puzzle.revealImage))
      : JSON.parse(JSON.stringify(puzzle.solution))
    undoStack.value = []
    redoStack.value = []
  }

  function exportPuzzle() {
    return {
      id: currentPuzzle.value?.id || `puzzle_${Date.now()}`,
      name: currentPuzzle.value?.name || 'Untitled',
      size: gridSize.value,
      solution: JSON.parse(JSON.stringify(solutionGrid.value)),
      palette: [...palette.value],
      revealImage: JSON.parse(JSON.stringify(revealGrid.value)),
      createdAt: currentPuzzle.value?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  // Local storage persistence
  function saveToLocalStorage() {
    localStorage.setItem('creator_packs', JSON.stringify(packs.value))
  }

  function loadFromLocalStorage() {
    const saved = localStorage.getItem('creator_packs')
    if (saved) {
      packs.value = JSON.parse(saved)
    } else {
      // No local data - will sync from server
      packs.value = []
    }
  }

  // API sync methods
  async function checkOnline() {
    try {
      await api.healthCheck()
      isOnline.value = true
      return true
    } catch {
      isOnline.value = false
      return false
    }
  }

  async function syncToServer() {
    if (!isOnline.value) return false

    isSyncing.value = true
    lastSyncError.value = null

    try {
      // Send entire packs array to server (preserves order from drag-and-drop)
      await api.packs.bulkUpdate(packs.value)

      saveToLocalStorage()
      isSyncing.value = false
      return true
    } catch (err) {
      lastSyncError.value = err.message
      isSyncing.value = false
      return false
    }
  }

  async function syncFromServer() {
    if (!isOnline.value) return false

    isSyncing.value = true
    lastSyncError.value = null

    try {
      const serverPacks = await api.packs.getAll()

      // Server is the source of truth
      packs.value = serverPacks

      saveToLocalStorage()
      isSyncing.value = false
      return true
    } catch (err) {
      lastSyncError.value = err.message
      isSyncing.value = false
      return false
    }
  }

  async function publishPack(packId) {
    if (!isOnline.value) return false

    try {
      // First sync the pack to server
      const pack = packs.value.find(p => p.id === packId)
      if (!pack) return false

      // Update on server
      await api.packs.update(packId, pack)

      // Toggle publish status
      const updatedPack = await api.packs.togglePublish(packId)
      pack.published = updatedPack.published

      saveToLocalStorage()
      return true
    } catch (err) {
      lastSyncError.value = err.message
      return false
    }
  }

  async function getPublishedPacks() {
    try {
      return await api.packs.getPublished()
    } catch {
      return []
    }
  }

  return {
    // Sync state
    isOnline,
    isSyncing,
    lastSyncError,
    // State
    packs,
    currentPack,
    currentPuzzle,
    currentTool,
    currentLayer,
    currentColorIndex,
    palette,
    gridSize,
    zoom,
    solutionGrid,
    revealGrid,

    // Computed
    canUndo,
    canRedo,
    filledCellCount,
    totalCells,
    fillPercentage,
    rowClues,
    colClues,

    // Actions
    initializeGrids,
    saveState,
    undo,
    redo,
    setCell,
    floodFill,
    drawLine,
    drawRect,
    clearGrid,
    resizeGrid,
    addColor,
    removeColor,
    updateColor,
    loadPacks,
    createPack,
    loadPuzzle,
    exportPuzzle,
    saveToLocalStorage,
    loadFromLocalStorage,
    checkOnline,
    syncToServer,
    syncFromServer,
    publishPack,
    getPublishedPacks
  }
})
