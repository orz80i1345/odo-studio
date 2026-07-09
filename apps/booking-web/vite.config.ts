/**
 * vite.config.ts — booking-web
 * Tailwind v4 走官方 Vite plugin，不需要 postcss / tailwind.config.js。
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
})
