import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const pagePath = (path: string) => fileURLToPath(new URL(path, import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: pagePath('./index.html'),
        gallery: pagePath('./gallery/index.html'),
        calendar: pagePath('./calendar/index.html'),
        organization: pagePath('./organization/index.html'),
        contact: pagePath('./contact/index.html'),
      },
    },
  },
})
