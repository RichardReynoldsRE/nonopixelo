// Update checker service - checks GitHub releases for new versions

const GITHUB_REPO = 'RichardReynoldsRE/nonopixelo'
const CURRENT_VERSION = '1.0.1'

// Parse version string to comparable numbers
function parseVersion(versionStr) {
  // Remove 'v' prefix if present
  const clean = versionStr.replace(/^v/, '')
  const parts = clean.split('.').map(n => parseInt(n, 10) || 0)
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0
  }
}

// Compare two versions, returns true if remote is newer
function isNewerVersion(current, remote) {
  const curr = parseVersion(current)
  const rem = parseVersion(remote)

  if (rem.major > curr.major) return true
  if (rem.major < curr.major) return false

  if (rem.minor > curr.minor) return true
  if (rem.minor < curr.minor) return false

  return rem.patch > curr.patch
}

// Check for updates from GitHub releases
export async function checkForUpdates() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    )

    if (!response.ok) {
      // No releases yet or repo not found
      return null
    }

    const release = await response.json()
    const latestVersion = release.tag_name

    if (isNewerVersion(CURRENT_VERSION, latestVersion)) {
      // Find APK asset
      const apkAsset = release.assets?.find(
        asset => asset.name.endsWith('.apk')
      )

      return {
        version: latestVersion,
        currentVersion: CURRENT_VERSION,
        notes: release.body || '',
        releaseName: release.name || latestVersion,
        downloadUrl: apkAsset?.browser_download_url || release.html_url,
        releaseUrl: release.html_url,
        publishedAt: release.published_at
      }
    }

    return null // No update available
  } catch (error) {
    console.error('Update check failed:', error)
    return null // Fail silently - don't bother user if offline
  }
}

// Get current version
export function getCurrentVersion() {
  return CURRENT_VERSION
}
