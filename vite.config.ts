import { readdirSync, rmSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

// Vite copies public/ verbatim, so OS metadata files there end up in the build.
const OS_FILES = /^(\.DS_Store|\._.*|Thumbs\.db|ehthumbs\.db|desktop\.ini)$/i

function stripOsFiles(): Plugin {
  let outDir = ''
  return {
    name: 'strip-os-files',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      for (const file of readdirSync(outDir, { recursive: true, encoding: 'utf8' })) {
        if (OS_FILES.test(basename(file))) rmSync(join(outDir, file), { force: true })
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    stripOsFiles(),
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
        entryFileNames: 'assets/cdcp-searchResults/search-[hash].js',
        assetFileNames: 'assets/cdcp-searchResults/[name]-[hash][extname]',
      },
      //external: ['/config/settings.ts'],
    }
  }
})
