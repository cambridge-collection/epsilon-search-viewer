import { fileURLToPath, URL } from 'node:url'
import del from "rollup-plugin-delete";

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      input: {
        app: './search.html', // default
      },
      output: {
        //dir: 'assets/cdcp-searchResults',
        entryFileNames: 'assets/cdcp-searchResults/search.js',
        assetFileNames: 'assets/cdcp-searchResults/search.css',
      },
      //external: ['/config/settings.ts'],
      plugins: [
        del({ targets: ["dist/sites*/**", "dist/modules*/**", "dist/misc*/**"], hook: "writeBundle" })
      ]
    }
  }
})
