<script setup>
import { watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  closable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close'])

function close() {
  if (props.closable) {
    emit('close')
  }
}

function handleKeydown(e) {
  if (e.key === 'Escape' && props.closable) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  // Always reset body overflow when modal unmounts
  document.body.style.overflow = ''
})

// Prevent body scroll when modal is open
watch(() => props.show, (show) => {
  if (show) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}, { immediate: true })
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="close"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <!-- Modal content -->
        <div class="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 max-w-md w-full animate-slide-up">
          <button
            v-if="closable"
            class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            @click="close"
          >
            <span class="text-2xl">✕</span>
          </button>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative {
  transition: transform 0.35s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.modal-leave-active .relative {
  transition: transform 0.2s ease;
}

.modal-enter-from .relative {
  transform: scale(0.85) translateY(30px);
}

.modal-leave-to .relative {
  transform: scale(0.95) translateY(10px);
}
</style>
