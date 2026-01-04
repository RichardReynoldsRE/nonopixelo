import { Router } from 'express'
import { writeFile, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { getPacks, savePacks } from '../storage.js'

const execAsync = promisify(exec)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = Router()

// GET /api/packs - List all packs
router.get('/', async (req, res) => {
  try {
    const packs = await getPacks()
    res.json(packs)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch packs' })
  }
})

// GET /api/packs/published - List only published packs (for game)
router.get('/published', async (req, res) => {
  try {
    const packs = await getPacks()
    const published = packs.filter(p => p.published)
    res.json(published)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch published packs' })
  }
})

// PUT /api/packs/bulk - Replace all packs with ordered array from creator
// NOTE: Must be before /:id route to avoid being matched as id="bulk"
router.put('/bulk', async (req, res) => {
  try {
    const newPacks = req.body.packs || []
    await savePacks(newPacks)
    res.json({ success: true, count: newPacks.length })
  } catch (err) {
    console.error('Error bulk updating packs:', err)
    res.status(500).json({ error: 'Failed to bulk update packs' })
  }
})

// GET /api/packs/:id - Get single pack
router.get('/:id', async (req, res) => {
  try {
    const packs = await getPacks()
    const pack = packs.find(p => p.id === req.params.id)

    if (!pack) {
      return res.status(404).json({ error: 'Pack not found' })
    }

    res.json(pack)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pack' })
  }
})

// POST /api/packs - Create new pack
router.post('/', async (req, res) => {
  try {
    const packs = await getPacks()
    const newPack = {
      id: `pack_${Date.now()}`,
      name: req.body.name || 'New Pack',
      description: req.body.description || '',
      icon: req.body.icon || '📦',
      puzzles: req.body.puzzles || [],
      published: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    packs.push(newPack)
    await savePacks(packs)

    res.status(201).json(newPack)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create pack' })
  }
})

// PUT /api/packs/:id - Update pack
router.put('/:id', async (req, res) => {
  try {
    const packs = await getPacks()
    const index = packs.findIndex(p => p.id === req.params.id)

    if (index === -1) {
      return res.status(404).json({ error: 'Pack not found' })
    }

    const updatedPack = {
      ...packs[index],
      ...req.body,
      id: packs[index].id, // Prevent ID change
      updatedAt: new Date().toISOString()
    }

    packs[index] = updatedPack
    await savePacks(packs)

    res.json(updatedPack)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update pack' })
  }
})

// DELETE /api/packs/:id - Delete pack
router.delete('/:id', async (req, res) => {
  try {
    const packs = await getPacks()
    const index = packs.findIndex(p => p.id === req.params.id)

    if (index === -1) {
      return res.status(404).json({ error: 'Pack not found' })
    }

    packs.splice(index, 1)
    await savePacks(packs)

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete pack' })
  }
})

// POST /api/packs/:id/publish - Toggle publish status
router.post('/:id/publish', async (req, res) => {
  try {
    const packs = await getPacks()
    const index = packs.findIndex(p => p.id === req.params.id)

    if (index === -1) {
      return res.status(404).json({ error: 'Pack not found' })
    }

    packs[index].published = !packs[index].published
    packs[index].updatedAt = new Date().toISOString()
    await savePacks(packs)

    res.json(packs[index])
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle publish status' })
  }
})

// POST /api/packs/import - Import pack from JSON
router.post('/import', async (req, res) => {
  try {
    const packs = await getPacks()
    const importedPack = {
      ...req.body,
      id: `pack_${Date.now()}`,
      published: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    packs.push(importedPack)
    await savePacks(packs)

    res.status(201).json(importedPack)
  } catch (err) {
    res.status(500).json({ error: 'Failed to import pack' })
  }
})

// POST /api/packs/:id/add-to-game - Add pack to built-in game data
router.post('/:id/add-to-game', async (req, res) => {
  try {
    const packs = await getPacks()
    const pack = packs.find(p => p.id === req.params.id)

    if (!pack) {
      return res.status(404).json({ error: 'Pack not found' })
    }

    if (!pack.puzzles || pack.puzzles.length === 0) {
      return res.status(400).json({ error: 'Pack has no puzzles' })
    }

    // If this pack was imported from a built-in pack, use its original ID
    // This allows edited built-in packs to override the originals
    let safeId
    if (pack.builtInId) {
      safeId = pack.builtInId
    } else {
      // Generate a safe ID for new packs (lowercase, no spaces)
      safeId = pack.name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_')
    }

    // Path to custom packs file
    const customPacksPath = join(__dirname, '../../src/data/puzzles/custom.js')

    // Load existing custom packs or start fresh
    let customPacks = {}
    if (existsSync(customPacksPath)) {
      try {
        const content = await readFile(customPacksPath, 'utf-8')
        // Extract the object from the export
        const match = content.match(/export const customPacks = ({[\s\S]*});?\s*$/)
        if (match) {
          // Use eval carefully here - this is admin-only server code
          customPacks = eval('(' + match[1] + ')')
        }
      } catch (e) {
        console.log('Starting fresh custom packs file')
      }
    }

    // Create the pack data for the game
    const gamePack = {
      id: safeId,
      name: pack.name,
      description: pack.description || '',
      icon: pack.icon || '📦',
      color: pack.color || 'primary',
      published: pack.published !== false,
      featured: pack.featured || false,
      isEvent: pack.isEvent || false,
      eventStart: pack.eventStart || null,
      eventEnd: pack.eventEnd || null,
      puzzles: pack.puzzles.map(p => ({
        id: p.id,
        name: p.name,
        size: p.size,
        solution: p.solution,
        palette: p.palette,
        revealImage: p.revealImage
      }))
    }

    // Add/update the pack
    customPacks[safeId] = gamePack

    // Generate the file content
    const fileContent = `// Auto-generated custom packs from Creator
// Do not edit manually - use the Creator tool

export const customPacks = ${JSON.stringify(customPacks, null, 2)};
`

    // Write the file
    await writeFile(customPacksPath, fileContent, 'utf-8')

    // Update the pack as "added to game"
    pack.addedToGame = true
    pack.gamePackId = safeId
    await savePacks(packs)

    res.json({
      success: true,
      gamePackId: safeId,
      message: `Pack "${pack.name}" added to game as "${safeId}". Rebuild the app to include it.`
    })
  } catch (err) {
    console.error('Error adding pack to game:', err)
    res.status(500).json({ error: 'Failed to add pack to game' })
  }
})

// POST /api/packs/sync-all-to-game - Sync all packs to game at once
router.post('/sync-all-to-game', async (req, res) => {
  try {
    const packs = await getPacks()

    if (packs.length === 0) {
      return res.status(400).json({ error: 'No packs to sync' })
    }

    const customPacksPath = join(__dirname, '../../src/data/puzzles/custom.js')
    const customPacks = {}

    // Track order based on position in creator's pack list
    let orderIndex = 0

    for (const pack of packs) {
      if (!pack.puzzles || pack.puzzles.length === 0) continue

      // Use existing pack ID if it's a simple alphanumeric ID, otherwise generate from name
      let safeId
      if (pack.id && /^[a-z0-9_]+$/.test(pack.id)) {
        safeId = pack.id
      } else {
        safeId = pack.name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_')
      }

      // Skip duplicates - only use the first occurrence of each pack ID
      if (customPacks[safeId]) {
        continue
      }

      customPacks[safeId] = {
        id: safeId,
        name: pack.name,
        description: pack.description || '',
        icon: pack.icon || '📦',
        color: pack.color || 'primary',
        published: pack.published !== false,
        featured: pack.featured || false,
        highlightColor: pack.highlightColor || null,
        order: orderIndex++, // Preserve order from creator
        isEvent: pack.isEvent || false,
        eventStart: pack.eventStart || null,
        eventEnd: pack.eventEnd || null,
        puzzles: pack.puzzles.map(p => ({
          id: p.id,
          name: p.name,
          size: p.size,
          solution: p.solution,
          palette: p.palette,
          revealImage: p.revealImage
        }))
      }

      // Update pack metadata
      pack.addedToGame = true
      pack.gamePackId = safeId
    }

    // Write custom.js
    const fileContent = `// Auto-generated custom packs from Creator
// Do not edit manually - use the Creator tool

export const customPacks = ${JSON.stringify(customPacks, null, 2)};
`
    await writeFile(customPacksPath, fileContent, 'utf-8')
    await savePacks(packs)

    res.json({
      success: true,
      count: Object.keys(customPacks).length,
      message: `${Object.keys(customPacks).length} packs synced to game`
    })
  } catch (err) {
    console.error('Error syncing all packs:', err)
    res.status(500).json({ error: 'Failed to sync packs to game' })
  }
})

// POST /api/packs/rebuild - Rebuild the app
router.post('/rebuild', async (req, res) => {
  try {
    const projectRoot = join(__dirname, '../..')
    console.log('Starting app rebuild...')

    const { stdout, stderr } = await execAsync('npm run build', {
      cwd: projectRoot,
      timeout: 120000 // 2 minute timeout
    })

    console.log('Build output:', stdout)
    if (stderr) console.log('Build stderr:', stderr)

    res.json({
      success: true,
      message: 'App rebuilt successfully!',
      output: stdout
    })
  } catch (err) {
    console.error('Build failed:', err)
    res.status(500).json({
      error: 'Build failed',
      details: err.message,
      output: err.stdout || ''
    })
  }
})

export default router
