import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import '@fontsource-variable/manrope'
import '@/style.css'
import App from '@/App.vue'
import router from '@/router.js'

createApp(App).use(createPinia()).use(router).use(Toast).mount('#app')
