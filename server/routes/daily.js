import { Router } from 'express'
import { getDailyOverrides, saveDailyOverrides, getPacks } from '../storage.js'

const router = Router()

// Simple seeded random number generator
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Generate a daily puzzle based on date
function generateDailyPuzzle(dateStr) {
  const date = new Date(dateStr)
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()

  // Determine size based on day of week (easier on weekdays, harder on weekends)
  const dayOfWeek = date.getDay()
  let size
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    size = 10 + Math.floor(seededRandom(seed) * 6) // 10-15 for weekends
  } else {
    size = 5 + Math.floor(seededRandom(seed + 1) * 6) // 5-10 for weekdays
  }

  // Generate solution grid
  const solution = []
  const density = 0.4 + seededRandom(seed + 2) * 0.3 // 40-70% filled

  for (let r = 0; r < size; r++) {
    const row = []
    for (let c = 0; c < size; c++) {
      const cellSeed = seed + r * 100 + c
      row.push(seededRandom(cellSeed) < density ? 1 : 0)
    }
    solution.push(row)
  }

  // Generate color
  const colors = ['#06b6d4', '#f97316', '#22c55e', '#a855f7', '#ec4899', '#eab308']
  const color = colors[Math.floor(seededRandom(seed + 3) * colors.length)]

  return {
    id: `daily_${dateStr}`,
    name: `Daily ${date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`,
    size,
    solution,
    color,
    isGenerated: true,
    date: dateStr
  }
}

// GET /api/daily/:date - Get daily puzzle for date
router.get('/:date', async (req, res) => {
  try {
    const dateStr = req.params.date

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' })
    }

    // Check for custom override
    const overrides = await getDailyOverrides()

    if (overrides[dateStr]) {
      return res.json({
        ...overrides[dateStr],
        isOverride: true,
        date: dateStr
      })
    }

    // Generate default daily puzzle
    const puzzle = generateDailyPuzzle(dateStr)
    res.json(puzzle)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch daily puzzle' })
  }
})

// POST /api/daily/:date - Set custom daily puzzle
router.post('/:date', async (req, res) => {
  try {
    const dateStr = req.params.date

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' })
    }

    const overrides = await getDailyOverrides()

    overrides[dateStr] = {
      ...req.body,
      id: `daily_${dateStr}`,
      date: dateStr,
      updatedAt: new Date().toISOString()
    }

    await saveDailyOverrides(overrides)

    res.json(overrides[dateStr])
  } catch (err) {
    res.status(500).json({ error: 'Failed to set daily puzzle' })
  }
})

// DELETE /api/daily/:date - Remove custom override (revert to generated)
router.delete('/:date', async (req, res) => {
  try {
    const dateStr = req.params.date

    const overrides = await getDailyOverrides()
    delete overrides[dateStr]
    await saveDailyOverrides(overrides)

    // Return the generated puzzle instead
    const puzzle = generateDailyPuzzle(dateStr)
    res.json(puzzle)
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove daily override' })
  }
})

// GET /api/daily/range/:start/:end - Get daily puzzles for date range
router.get('/range/:start/:end', async (req, res) => {
  try {
    const startDate = new Date(req.params.start)
    const endDate = new Date(req.params.end)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' })
    }

    const overrides = await getDailyOverrides()
    const puzzles = []

    const current = new Date(startDate)
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0]

      if (overrides[dateStr]) {
        puzzles.push({
          ...overrides[dateStr],
          isOverride: true,
          date: dateStr
        })
      } else {
        puzzles.push(generateDailyPuzzle(dateStr))
      }

      current.setDate(current.getDate() + 1)
    }

    res.json(puzzles)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch daily puzzles' })
  }
})

export default router
