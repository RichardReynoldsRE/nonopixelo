const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  }

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body)
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || 'Request failed')
    }

    return response.json()
  } catch (err) {
    console.error(`API Error: ${path}`, err)
    throw err
  }
}

// Pack endpoints
export const packsApi = {
  getAll: () => request('/packs'),
  getPublished: () => request('/packs/published'),
  get: (id) => request(`/packs/${id}`),
  create: (data) => request('/packs', { method: 'POST', body: data }),
  update: (id, data) => request(`/packs/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/packs/${id}`, { method: 'DELETE' }),
  togglePublish: (id) => request(`/packs/${id}/publish`, { method: 'POST' }),
  import: (data) => request('/packs/import', { method: 'POST', body: data }),
  addToGame: (id) => request(`/packs/${id}/add-to-game`, { method: 'POST' }),
  syncAllToGame: () => request('/packs/sync-all-to-game', { method: 'POST' }),
  rebuild: () => request('/packs/rebuild', { method: 'POST' }),
  bulkUpdate: (packs) => request('/packs/bulk', { method: 'PUT', body: { packs } })
}

// Puzzle endpoints
export const puzzlesApi = {
  getAll: (packId) => request(`/puzzles/${packId}`),
  get: (packId, puzzleId) => request(`/puzzles/${packId}/${puzzleId}`),
  create: (packId, data) => request(`/puzzles/${packId}`, { method: 'POST', body: data }),
  update: (packId, puzzleId, data) => request(`/puzzles/${packId}/${puzzleId}`, { method: 'PUT', body: data }),
  delete: (packId, puzzleId) => request(`/puzzles/${packId}/${puzzleId}`, { method: 'DELETE' }),
  reorder: (packId, puzzleIds) => request(`/puzzles/${packId}/reorder`, { method: 'POST', body: { puzzleIds } })
}

// Daily puzzle endpoints
export const dailyApi = {
  get: (date) => request(`/daily/${date}`),
  set: (date, data) => request(`/daily/${date}`, { method: 'POST', body: data }),
  remove: (date) => request(`/daily/${date}`, { method: 'DELETE' }),
  getRange: (start, end) => request(`/daily/range/${start}/${end}`)
}

// Health check
export const healthCheck = () => request('/health')

export default {
  packs: packsApi,
  puzzles: puzzlesApi,
  daily: dailyApi,
  healthCheck
}
