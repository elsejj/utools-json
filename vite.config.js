import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import Components from 'unplugin-vue-components/vite';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import wasm from "vite-plugin-wasm";
//import topLevelAwait from "vite-plugin-top-level-await";


// https://vite.dev/config/
export default defineConfig({
  base: '',
  plugins: [
    vue(),
    //vueDevTools(),
    tailwindcss(),
    wasm(),
    //topLevelAwait(),
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
    chunkSizeWarningLimit: 1000000,
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
        },
      },
    },

  },

})
