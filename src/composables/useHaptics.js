import { useSettingsStore } from '@/stores/settingsStore'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

// Check if running in Capacitor native environment
const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform()

// Web fallback using vibration API
function webVibrate(pattern) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern)
  }
}

export function useHaptics() {
  const settingsStore = useSettingsStore()

  async function playLight() {
    if (!settingsStore.hapticEnabled) return

    try {
      if (isNative) {
        await Haptics.impact({ style: ImpactStyle.Light })
      } else {
        webVibrate(10)
      }
    } catch (e) {
      // Haptics not supported
    }
  }

  async function playMedium() {
    if (!settingsStore.hapticEnabled) return

    try {
      if (isNative) {
        await Haptics.impact({ style: ImpactStyle.Medium })
      } else {
        webVibrate(20)
      }
    } catch (e) {
      // Haptics not supported
    }
  }

  async function playHeavy() {
    if (!settingsStore.hapticEnabled) return

    try {
      if (isNative) {
        await Haptics.impact({ style: ImpactStyle.Heavy })
      } else {
        webVibrate(30)
      }
    } catch (e) {
      // Haptics not supported
    }
  }

  async function playError() {
    if (!settingsStore.hapticEnabled) return

    try {
      if (isNative) {
        await Haptics.notification({ type: NotificationType.Error })
      } else {
        webVibrate([50, 50, 50])
      }
    } catch (e) {
      // Haptics not supported
    }
  }

  async function playSuccess() {
    if (!settingsStore.hapticEnabled) return

    try {
      if (isNative) {
        await Haptics.notification({ type: NotificationType.Success })
      } else {
        webVibrate([30, 50, 30, 50, 30])
      }
    } catch (e) {
      // Haptics not supported
    }
  }

  async function playWarning() {
    if (!settingsStore.hapticEnabled) return

    try {
      if (isNative) {
        await Haptics.notification({ type: NotificationType.Warning })
      } else {
        webVibrate([100, 50, 100])
      }
    } catch (e) {
      // Haptics not supported
    }
  }

  // Haptic handler for game store - mirrors sound handler pattern
  function handleHaptic(type) {
    switch (type) {
      case 'fill':
        playLight()
        break
      case 'mark':
        playLight()
        break
      case 'wrong':
        playError()
        break
      case 'automark':
        playMedium()
        break
      case 'win':
        playSuccess()
        break
      case 'gameover':
        playWarning()
        break
      case 'hint':
        playMedium()
        break
    }
  }

  return {
    playLight,
    playMedium,
    playHeavy,
    playError,
    playSuccess,
    playWarning,
    handleHaptic
  }
}
