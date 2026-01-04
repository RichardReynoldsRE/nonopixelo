<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  state: String,
  highlight: {
    type: Boolean,
    default: false
  }
})

const animationClass = ref('')

// Trigger animations on state changes
watch(() => props.state, (newState, oldState) => {
  if (oldState === undefined) return

  if (newState === 'filled' && oldState === 'empty') {
    animationClass.value = 'animate-fill'
    setTimeout(() => animationClass.value = '', 200)
  } else if (newState === 'marked' && oldState === 'empty') {
    animationClass.value = 'animate-mark'
    setTimeout(() => animationClass.value = '', 150)
  } else if (newState === 'wrong') {
    animationClass.value = 'animate-wrong'
    setTimeout(() => animationClass.value = '', 400)
  }
})
</script>

<template>
  <div
    class="game-cell"
    :class="[{
      'cell-empty': state === 'empty',
      'cell-filled': state === 'filled',
      'cell-marked': state === 'marked',
      'cell-wrong': state === 'wrong',
      'cell-highlight': highlight && state === 'empty'
    }, animationClass]"
  >
    <span v-if="state === 'marked'" class="mark-icon">x</span>
    <span v-if="state === 'wrong'" class="wrong-icon">x</span>
  </div>
</template>

<style scoped>
.game-cell {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  border: 2px solid #e5e7eb;
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
  transform-origin: center;
}

.cell-empty {
  background-color: white;
}

.cell-empty:hover {
  background-color: #f0fdfa;
  border-color: #a5f3fc;
  transform: scale(1.02);
}

.cell-empty:active {
  transform: scale(0.95);
}

.cell-filled {
  background-color: #06b6d4;
  border-color: #0891b2;
  box-shadow: 0 2px 4px rgba(6, 182, 212, 0.3);
}

.cell-marked {
  background-color: #f8fafc;
  border-color: #cbd5e1;
}

.cell-wrong {
  background-color: #fee2e2;
  border-color: #f87171;
}

/* Tutorial highlight */
.cell-highlight {
  background-color: #ecfeff;
  border-color: #22d3ee;
  animation: cellHighlight 1.5s ease-in-out infinite;
}

@keyframes cellHighlight {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.4);
    border-color: #22d3ee;
  }
  50% {
    box-shadow: 0 0 8px 2px rgba(6, 182, 212, 0.3);
    border-color: #06b6d4;
  }
}

/* Animation classes */
.animate-fill {
  animation: cellPop 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.animate-mark {
  animation: cellMark 0.15s ease-out;
}

.animate-wrong {
  animation: cellShake 0.4s ease-in-out;
}

@keyframes cellPop {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

@keyframes cellMark {
  0% { transform: scale(1); }
  50% { transform: scale(1.08); }
  100% { transform: scale(1); }
}

@keyframes cellShake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-3px); }
  40% { transform: translateX(3px); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
}

.mark-icon {
  color: #94a3b8;
  font-weight: 800;
  font-size: 0.9rem;
  line-height: 1;
}

.wrong-icon {
  color: #ef4444;
  font-weight: 800;
  font-size: 0.9rem;
  line-height: 1;
  animation: iconPop 0.3s ease-out;
}

@keyframes iconPop {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.3); }
  100% { transform: scale(1); opacity: 1; }
}
</style>

<style>
/* Dark mode - unscoped to work with .dark on html */
.dark .game-cell {
  border-color: #475569;
}

.dark .cell-empty {
  background-color: #334155;
}

.dark .cell-empty:hover {
  background-color: #3f5169;
  border-color: #67e8f9;
}

.dark .cell-filled {
  background-color: #06b6d4;
  border-color: #22d3ee;
  box-shadow: 0 2px 8px rgba(6, 182, 212, 0.4);
}

.dark .cell-marked {
  background-color: #1e293b;
  border-color: #475569;
}

.dark .mark-icon {
  color: #64748b;
}

.dark .cell-wrong {
  background-color: #450a0a;
  border-color: #f87171;
}

.dark .cell-highlight {
  background-color: #164e63;
  border-color: #22d3ee;
}
</style>
