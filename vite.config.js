import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import Components from 'unplugin-vue-components/vite';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';


// https://vite.dev/config/
export default defineConfig({
  base: '',
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    Components({
      resolvers: [PrimeVueResolver()],
      dts: true, // Enable TypeScript support
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    //minify: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('monaco')) {
            return 'monaco'
          }
        },
        advancedChunks: {
          minSize: 1024,
          groups: [
            {
              name: 'monaco',
              test: '/node_modules[\\/]monaco-editor/',
            },
            {
              name: 'primevue',
              test: 'primevue'
            },
            {
              name: 'vue',
              test: 'vue'
            },
            {
              name: 'vendor',
              test: (id) => {
                return true;
              },
            }
          ],
        }
      },
    },

  },

})
