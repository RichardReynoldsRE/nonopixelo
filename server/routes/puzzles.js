import { Router } from 'express'
import { getPacks, savePacks } from '../storage.js'

const router = Router()

// GET /api/puzzles/:packId - Get all puzzles in a pack
router.get('/:packId', async (req, res) => {
  try {
    const packs = await getPacks()
    const pack = packs.find(p => p.id === req.params.packId)

    if (!pack) {
      return res.status(404).json({ error: 'Pack not found' })
    }

    res.json(pack.puzzles || [])
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch puzzles' })
  }
})

// GET /api/puzzles/:packId/:puzzleId - Get single puzzle
router.get('/:packId/:puzzleId', async (req, res) => {
  try {
    const packs = await getPacks()
    const pack = packs.find(p => p.id === req.params.packId)

    if (!pack) {
      return res.status(404).json({ error: 'Pack not found' })
    }

    const puzzle = pack.puzzles?.find(p => p.id === req.params.puzzleId)

    if (!puzzle) {
      return res.status(404).json({ error: 'Puzzle not found' })
    }

    res.json(puzzle)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch puzzle' })
  }
})

// POST /api/puzzles/:packId - Add puzzle to pack
router.post('/:packId', async (req, res) => {
  try {
    const packs = await getPacks()
    const packIndex = packs.findIndex(p => p.id === req.params.packId)

    if (packIndex === -1) {
      return res.status(404).json({ error: 'Pack not found' })
    }

    const newPuzzle = {
      id: `puzzle_${Date.now()}`,
      name: req.body.name || 'New Puzzle',
      size: req.body.size || 5,
      solution: req.body.solution || [],
      palette: req.body.palette || ['#06b6d4'],
      revealImage: req.body.revealImage || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    if (!packs[packIndex].puzzles) {
      packs[packIndex].puzzles = []
    }

    packs[packIndex].puzzles.push(newPuzzle)
    packs[packIndex].updatedAt = new Date().toISOString()
    await savePacks(packs)

    res.status(201).json(newPuzzle)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create puzzle' })
  }
})

// PUT /api/puzzles/:packId/:puzzleId - Update puzzle
router.put('/:packId/:puzzleId', async (req, res) => {
  try {
    const packs = await getPacks()
    const packIndex = packs.findIndex(p => p.id === req.params.packId)

    if (packIndex === -1) {
      return res.status(404).json({ error: 'Pack not found' })
    }

    const puzzleIndex = packs[packIndex].puzzles?.findIndex(p => p.id === req.params.puzzleId)

    if (puzzleIndex === -1 || puzzleIndex === undefined) {
      return res.status(404).json({ error: 'Puzzle not found' })
    }

    const updatedPuzzle = {
      ...packs[packIndex].puzzles[puzzleIndex],
      ...req.body,
      id: packs[packIndex].puzzles[puzzleIndex].id,
      updatedAt: new Date().toISOString()
    }

    packs[packIndex].puzzles[puzzleIndex] = updatedPuzzle
    packs[packIndex].updatedAt = new Date().toISOString()
    await savePacks(packs)

    res.json(updatedPuzzle)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update puzzle' })
  }
})

// DELETE /api/puzzles/:packId/:puzzleId - Delete puzzle
router.delete('/:packId/:puzzleId', async (req, res) => {
  try {
    const packs = await getPacks()
    const packIndex = packs.findIndex(p => p.id === req.params.packId)

    if (packIndex === -1) {
      return res.status(404).json({ error: 'Pack not found' })
    }

    const puzzleIndex = packs[packIndex].puzzles?.findIndex(p => p.id === req.params.puzzleId)

    if (puzzleIndex === -1 || puzzleIndex === undefined) {
      return res.status(404).json({ error: 'Puzzle not found' })
    }

    packs[packIndex].puzzles.splice(puzzleIndex, 1)
    packs[packIndex].updatedAt = new Date().toISOString()
    await savePacks(packs)

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete puzzle' })
  }
})

// POST /api/puzzles/:packId/reorder - Reorder puzzles
router.post('/:packId/reorder', async (req, res) => {
  try {
    const { puzzleIds } = req.body

    if (!Array.isArray(puzzleIds)) {
      return res.status(400).json({ error: 'puzzleIds must be an array' })
    }

    const packs = await getPacks()
    const packIndex = packs.findIndex(p => p.id === req.params.packId)

    if (packIndex === -1) {
      return res.status(404).json({ error: 'Pack not found' })
    }

    const puzzleMap = new Map(packs[packIndex].puzzles?.map(p => [p.id, p]) || [])
    const reorderedPuzzles = puzzleIds
      .map(id => puzzleMap.get(id))
      .filter(Boolean)

    packs[packIndex].puzzles = reorderedPuzzles
    packs[packIndex].updatedAt = new Date().toISOString()
    await savePacks(packs)

    res.json(reorderedPuzzles)
  } catch (err) {
    res.status(500).json({ error: 'Failed to reorder puzzles' })
  }
})

export default router
