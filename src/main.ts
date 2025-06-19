import './assets/main.css'

import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import App from './App.vue'
import Aura from '@primeuix/themes/aura';
import Tooltip from 'primevue/tooltip';


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
app.directive('tooltip', Tooltip);

app.mount('#app')
