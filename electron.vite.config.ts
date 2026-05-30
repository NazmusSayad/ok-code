import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'electron-vite'
import { resolve } from 'path'

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    clearScreen: false,
    resolve: {
      alias: {
        '@': resolve('./src/renderer/src'),
      },
    },

    plugins: [react(), tailwindcss()],
  },
})
