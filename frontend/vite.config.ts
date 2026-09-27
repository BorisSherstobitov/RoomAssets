import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/",
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // теперь можно import '@/components/Button'
    },
  },
  server: {
    host: true, // эквивалент "0.0.0.0"
    port: 5173,
    strictPort: true, // если занят — не переключаться автоматически
  },
})
