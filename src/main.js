import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize settings store early to ensure dark mode is applied
import { useSettingsStore } from './stores/settingsStore'
useSettingsStore()

app.mount('#app')
