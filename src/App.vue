<script setup>
import { RouterView } from 'vue-router'
import UpdateModal from '@/components/UpdateModal.vue'
</script>

<template>
  <div class="app-container safe-area-inset">
    <RouterView v-slot="{ Component }">
      <Transition name="fade" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>

    <!-- Update checker (runs on app launch) -->
    <UpdateModal />
  </div>
</template>

<style>
.app-container {
  min-height: 100vh;
  min-height: 100dvh; /* Dynamic viewport height for mobile */
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
