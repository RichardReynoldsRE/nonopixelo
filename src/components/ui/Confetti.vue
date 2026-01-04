<script setup>
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps({
  active: {
    type: Boolean,
    default: false
  },
  count: {
    type: Number,
    default: 60
  }
})

const particles = ref([])

// Vibrant celebration colors
const colors = [
  '#06b6d4', // cyan
  '#22d3ee', // light cyan
  '#f97316', // orange
  '#fb923c', // light orange
  '#58CC02', // Duolingo green
  '#4ade80', // light green
  '#fbbf24', // yellow
  '#a855f7', // purple
  '#ec4899', // pink
]

// Different shapes for variety
const shapes = ['square', 'circle', 'rectangle']

function generateParticles() {
  particles.value = Array.from({ length: props.count }, (_, i) => {
    const shape = shapes[Math.floor(Math.random() * shapes.length)]
    const size = 6 + Math.random() * 10

    return {
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.3,
      duration: 2.5 + Math.random() * 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      width: shape === 'rectangle' ? size * 0.4 : size,
      height: size,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 1080,
      shape,
      wobble: (Math.random() - 0.5) * 100
    }
  })
}

let timeout = null

watch(() => props.active, (active) => {
  if (active) {
    generateParticles()
    timeout = setTimeout(() => {
      particles.value = []
    }, 4500)
  } else {
    particles.value = []
  }
})

onUnmounted(() => {
  if (timeout) clearTimeout(timeout)
})
</script>

<template>
  <div v-if="particles.length > 0" class="fixed inset-0 pointer-events-none z-50 overflow-hidden">
    <div
      v-for="p in particles"
      :key="p.id"
      class="confetti-particle absolute top-0"
      :class="p.shape"
      :style="{
        left: `${p.left}%`,
        width: `${p.width}px`,
        height: `${p.height}px`,
        backgroundColor: p.color,
        '--delay': `${p.delay}s`,
        '--duration': `${p.duration}s`,
        '--rotation': `${p.rotation}deg`,
        '--rotation-speed': `${p.rotationSpeed}deg`,
        '--wobble': `${p.wobble}px`
      }"
    />
  </div>
</template>

<style scoped>
.confetti-particle {
  animation: confetti-fall var(--duration) ease-out var(--delay) forwards;
  transform: rotate(var(--rotation));
  opacity: 0;
}

.confetti-particle.square {
  border-radius: 2px;
}

.confetti-particle.circle {
  border-radius: 50%;
}

.confetti-particle.rectangle {
  border-radius: 1px;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(-20px) translateX(0) rotate(var(--rotation));
    opacity: 1;
  }
  25% {
    transform: translateY(25vh) translateX(var(--wobble)) rotate(calc(var(--rotation) + var(--rotation-speed) * 0.25));
    opacity: 1;
  }
  50% {
    transform: translateY(50vh) translateX(calc(var(--wobble) * -0.5)) rotate(calc(var(--rotation) + var(--rotation-speed) * 0.5));
    opacity: 0.9;
  }
  75% {
    transform: translateY(75vh) translateX(calc(var(--wobble) * 0.3)) rotate(calc(var(--rotation) + var(--rotation-speed) * 0.75));
    opacity: 0.5;
  }
  100% {
    transform: translateY(105vh) translateX(0) rotate(calc(var(--rotation) + var(--rotation-speed)));
    opacity: 0;
  }
}
</style>
