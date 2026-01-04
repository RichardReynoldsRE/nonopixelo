<script setup>
import { ref, onMounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import Modal from './ui/Modal.vue'
import { checkForUpdates, getCurrentVersion } from '@/services/updateService'

const showModal = ref(false)
const updateInfo = ref(null)
const checking = ref(false)

// Only check for updates on native platforms (Android/iOS)
async function checkUpdates() {
  if (!Capacitor.isNativePlatform()) {
    return
  }

  checking.value = true
  try {
    const update = await checkForUpdates()
    if (update) {
      updateInfo.value = update
      showModal.value = true
    }
  } finally {
    checking.value = false
  }
}

function closeModal() {
  showModal.value = false
}

function downloadUpdate() {
  if (updateInfo.value?.downloadUrl) {
    // Open in browser to download the APK
    window.open(updateInfo.value.downloadUrl, '_blank')
  }
  closeModal()
}

onMounted(() => {
  // Check for updates on mount (with small delay to not block app startup)
  setTimeout(checkUpdates, 2000)
})
</script>

<template>
  <Modal :show="showModal" @close="closeModal">
    <div class="text-center">
      <!-- Update icon -->
      <div class="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </div>

      <h2 class="text-xl font-bold text-gray-800 dark:text-white mb-2">
        Update Available
      </h2>

      <p class="text-gray-600 dark:text-gray-300 mb-4">
        A new version of Nonopixelo is available!
      </p>

      <!-- Version info -->
      <div class="bg-gray-100 dark:bg-slate-700 rounded-xl p-3 mb-4">
        <div class="flex justify-between text-sm">
          <span class="text-gray-500 dark:text-gray-400">Current:</span>
          <span class="font-mono text-gray-700 dark:text-gray-200">v{{ updateInfo?.currentVersion }}</span>
        </div>
        <div class="flex justify-between text-sm mt-1">
          <span class="text-gray-500 dark:text-gray-400">New:</span>
          <span class="font-mono text-green-600 dark:text-green-400 font-bold">{{ updateInfo?.version }}</span>
        </div>
      </div>

      <!-- Release notes if available -->
      <div v-if="updateInfo?.notes" class="text-left bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 mb-4 max-h-32 overflow-y-auto">
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">What's new:</p>
        <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{{ updateInfo.notes }}</p>
      </div>

      <!-- Buttons -->
      <div class="flex gap-3">
        <button
          @click="closeModal"
          class="flex-1 py-3 px-4 rounded-xl bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
        >
          Later
        </button>
        <button
          @click="downloadUpdate"
          class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:from-green-600 hover:to-emerald-600 transition-colors"
        >
          Update
        </button>
      </div>
    </div>
  </Modal>
</template>
