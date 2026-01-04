import { getScheduledPuzzle } from '@/data/dailyPuzzles'

// Seeded random number generator for daily puzzles
function seededRandom(seed) {
  let s = seed
  return function() {
    s = Math.sin(s) * 10000
    return s - Math.floor(s)
  }
}

// Color palette for daily puzzles
const dailyColors = [
  '#EF4444', // red
  '#F97316', // orange
  '#FBBF24', // yellow
  '#22C55E', // green
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
]

// Generate a puzzle solution from a seed
export function generatePuzzle(seed, size = 10) {
  const random = seededRandom(seed)

  // Generate a solution that forms interesting patterns
  const solution = []

  // Target fill ratio (30-60% filled cells)
  const fillRatio = 0.3 + random() * 0.3

  for (let r = 0; r < size; r++) {
    const row = []
    for (let c = 0; c < size; c++) {
      // Use multiple factors to create more interesting patterns
      const centerDist = Math.sqrt(
        Math.pow((r - size / 2) / size, 2) +
        Math.pow((c - size / 2) / size, 2)
      )

      // Random factor with center bias
      const centerBias = 1 - centerDist * 0.5
      const threshold = fillRatio * centerBias

      row.push(random() < threshold ? 1 : 0)
    }
    solution.push(row)
  }

  // Apply some cleanup to make the puzzle solvable and interesting
  // Remove isolated single cells
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (solution[r][c] === 1) {
        const neighbors = countNeighbors(solution, r, c, size)
        if (neighbors === 0 && random() > 0.3) {
          solution[r][c] = 0
        }
      }
    }
  }

  // Ensure there's at least one filled cell per row and column
  for (let r = 0; r < size; r++) {
    if (!solution[r].includes(1)) {
      solution[r][Math.floor(random() * size)] = 1
    }
  }

  for (let c = 0; c < size; c++) {
    let hasOne = false
    for (let r = 0; r < size; r++) {
      if (solution[r][c] === 1) {
        hasOne = true
        break
      }
    }
    if (!hasOne) {
      solution[Math.floor(random() * size)][c] = 1
    }
  }

  // Pick a color based on seed
  const color = dailyColors[seed % dailyColors.length]

  return {
    id: `daily_${seed}`,
    name: 'Daily Challenge',
    size,
    color,
    solution
  }
}

function countNeighbors(grid, r, c, size) {
  let count = 0
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]

  for (const [dr, dc] of dirs) {
    const nr = r + dr
    const nc = c + dc
    if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
      count += grid[nr][nc]
    }
  }

  return count
}

// Get local date string (YYYY-MM-DD)
function getLocalDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Generate daily puzzle based on date
export function getDailyPuzzle(dateString = null) {
  const date = dateString || getLocalDateString()

  // Check for a scheduled puzzle first
  const scheduled = getScheduledPuzzle(date)
  if (scheduled) {
    return {
      id: `daily_${date}`,
      name: scheduled.name,
      size: scheduled.size,
      color: scheduled.color,
      solution: scheduled.solution
    }
  }

  // Fall back to auto-generated puzzle
  // Create seed from date
  let seed = 0
  for (let i = 0; i < date.length; i++) {
    seed = ((seed << 5) - seed) + date.charCodeAt(i)
    seed = seed & seed
  }
  seed = Math.abs(seed)

  // Vary size based on day of week (easier on weekends)
  const dayOfWeek = new Date(date).getDay()
  let size
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    size = 5 // Weekend: easier 5x5
  } else if (dayOfWeek <= 2) {
    size = 10 // Mon-Tue: medium 10x10
  } else {
    size = 10 // Wed-Fri: still 10x10 but could be harder patterns
  }

  return generatePuzzle(seed, size)
}
