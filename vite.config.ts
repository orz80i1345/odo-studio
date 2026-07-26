import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const appRoot = resolve(__dirname, 'apps/booking-web')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, appRoot, '')
  const apiOrigin = new URL(env.VITE_API_BASE_URL ?? 'https://cv3op1ht.cgapps.dev/api').origin

  return {
    root: appRoot,
    envDir: appRoot,
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: apiOrigin,
          changeOrigin: true,
          secure: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  }
})
