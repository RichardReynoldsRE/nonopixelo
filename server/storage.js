import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DATA_DIR = join(__dirname, 'data')

// Ensure data directory exists
async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true })
  }
}

// Read JSON file
export async function readJsonFile(filename) {
  await ensureDataDir()
  const filepath = join(DATA_DIR, filename)

  if (!existsSync(filepath)) {
    return null
  }

  try {
    const data = await readFile(filepath, 'utf-8')
    return JSON.parse(data)
  } catch (err) {
    console.error(`Error reading ${filename}:`, err)
    return null
  }
}

// Write JSON file
export async function writeJsonFile(filename, data) {
  await ensureDataDir()
  const filepath = join(DATA_DIR, filename)

  try {
    await writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8')
    return true
  } catch (err) {
    console.error(`Error writing ${filename}:`, err)
    return false
  }
}

// Get all packs
export async function getPacks() {
  const data = await readJsonFile('packs.json')
  return data?.packs || []
}

// Save all packs
export async function savePacks(packs) {
  return writeJsonFile('packs.json', { packs, updatedAt: new Date().toISOString() })
}

// Get daily overrides
export async function getDailyOverrides() {
  const data = await readJsonFile('daily.json')
  return data?.overrides || {}
}

// Save daily overrides
export async function saveDailyOverrides(overrides) {
  return writeJsonFile('daily.json', { overrides, updatedAt: new Date().toISOString() })
}
