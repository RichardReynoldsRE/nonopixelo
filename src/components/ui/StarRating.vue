<script setup>
import { computed } from 'vue'

const props = defineProps({
  stars: {
    type: Number,
    default: 0,
    validator: (v) => v >= 0 && v <= 3
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  },
  animated: {
    type: Boolean,
    default: false
  }
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'text-xl'
    case 'lg': return 'text-5xl'
    default: return 'text-3xl'
  }
})

const starArray = computed(() => {
  return [1, 2, 3].map(i => ({
    filled: i <= props.stars,
    delay: props.animated ? `${(i - 1) * 150 + 100}ms` : '0ms'
  }))
})
</script>

<template>
  <div class="flex gap-2 items-center" :class="sizeClass">
    <div
      v-for="(star, i) in starArray"
      :key="i"
      class="star-wrapper"
      :class="{ 'star-filled': star.filled, 'star-animated': animated && star.filled }"
      :style="{ animationDelay: star.delay }"
    >
      <span class="star-icon">{{ star.filled ? '⭐' : '☆' }}</span>
      <span v-if="star.filled && animated" class="star-glow"></span>
    </div>
  </div>
</template>

<style scoped>
.star-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.star-icon {
  position: relative;
  z-index: 1;
  filter: grayscale(100%) opacity(0.3);
  transition: filter 0.3s ease, transform 0.3s ease;
}

.star-filled .star-icon {
  filter: none;
  transform: scale(1);
}

.star-animated {
  animation: starPop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
  opacity: 0;
  transform: scale(0);
}

.star-glow {
  position: absolute;
  inset: -4px;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%);
  border-radius: 50%;
  animation: starGlow 1s ease-out forwards;
  z-index: 0;
}

@keyframes starPop {
  0% {
    opacity: 0;
    transform: scale(0) rotate(-30deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.3) rotate(10deg);
  }
  70% {
    transform: scale(0.9) rotate(-5deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

@keyframes starGlow {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  50% {
    opacity: 1;
    transform: scale(1.5);
  }
  100% {
    opacity: 0;
    transform: scale(2);
  }
}
</style>
