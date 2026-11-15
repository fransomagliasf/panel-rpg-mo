import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['Chrome >= 49', 'Safari >= 10', 'Firefox >= 52', 'Edge >= 15'],
    }),
  ],
  base: '/panel-rpg-mo/',
  server: { host: '127.0.0.1', port: 4173 },
})
