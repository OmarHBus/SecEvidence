import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const host = process.env.TAURI_DEV_HOST
const tauriPlatform = process.env.TAURI_ENV_PLATFORM

export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: tauriPlatform
      ? tauriPlatform === 'windows'
        ? 'chrome105'
        : 'safari13'
      : undefined,
    minify: process.env.TAURI_ENV_DEBUG ? false : 'esbuild',
    sourcemap: Boolean(process.env.TAURI_ENV_DEBUG),
  },
})
