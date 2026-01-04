import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/play/:packId/:puzzleId',
    name: 'Play',
    component: () => import('../views/PlayView.vue'),
    props: true
  },
  {
    path: '/levels',
    name: 'Levels',
    component: () => import('../views/LevelsView.vue')
  },
  {
    path: '/levels/:packId',
    name: 'PackLevels',
    component: () => import('../views/PackLevelsView.vue'),
    props: true
  },
  {
    path: '/daily',
    name: 'Daily',
    component: () => import('../views/DailyView.vue')
  },
  {
    path: '/achievements',
    name: 'Achievements',
    component: () => import('../views/AchievementsView.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/SettingsView.vue')
  },
  // Creator routes
  {
    path: '/creator',
    name: 'Creator',
    component: () => import('../views/CreatorDashboard.vue')
  },
  {
    path: '/creator/pack/:packId',
    name: 'PackEditor',
    component: () => import('../views/PackEditor.vue'),
    props: true
  },
  {
    path: '/creator/puzzle/:packId/:puzzleId?',
    name: 'PuzzleEditor',
    component: () => import('../views/PuzzleEditor.vue'),
    props: true
  },
  {
    path: '/creator/daily',
    name: 'DailyScheduler',
    component: () => import('../views/DailyScheduler.vue')
  },
  {
    path: '/creator/daily/:date',
    name: 'DailyPuzzleEditor',
    component: () => import('../views/DailyPuzzleEditor.vue'),
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Always scroll to top when navigating
    return { top: 0, behavior: 'instant' }
  }
})

// Block creator routes on native mobile app (no server access)
const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform()

router.beforeEach((to) => {
  if (isNative && to.path.startsWith('/creator')) {
    return { name: 'Home' }
  }
})

export default router
