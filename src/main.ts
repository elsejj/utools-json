import './assets/main.css'

import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import App from './App.vue'
import Aura from '@primeuix/themes/aura';
import Tooltip from 'primevue/tooltip';
import { createPinia } from 'pinia'


const app = createApp(App)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      cssLayer: {
        name: 'primevue',
        order: 'theme, base, primevue'
      },
      darkModeSelector: 'system',
    }
  }
})
const pinia = createPinia()
app.use(pinia)
app.directive('tooltip', Tooltip);

app.mount('#app')
