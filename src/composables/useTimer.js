import { ref, computed, onUnmounted } from 'vue'

export function useTimer() {
  const startTime = ref(null)
  const elapsedMs = ref(0)
  const isRunning = ref(false)
  let intervalId = null

  const formatted = computed(() => {
    const totalSeconds = Math.floor(elapsedMs.value / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  function start() {
    if (isRunning.value) return
    startTime.value = Date.now() - elapsedMs.value
    isRunning.value = true
    intervalId = setInterval(() => {
      elapsedMs.value = Date.now() - startTime.value
    }, 100)
  }

  function pause() {
    if (!isRunning.value) return
    isRunning.value = false
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function reset() {
    pause()
    elapsedMs.value = 0
    startTime.value = null
  }

  function stop() {
    pause()
    return elapsedMs.value
  }

  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId)
    }
  })

  return {
    elapsedMs,
    formatted,
    isRunning,
    start,
    pause,
    reset,
    stop
  }
}
