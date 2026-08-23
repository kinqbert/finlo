import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react-vendor', test: /node_modules[\\/](?:react(?:-dom)?|react-router|scheduler)(?:[\\/]|$)/, priority: 4 },
            { name: 'data-vendor', test: /node_modules[\\/](?:@tanstack[\\/]react-query|axios|zustand)(?:[\\/]|$)/, priority: 3 },
            { name: 'forms-vendor', test: /node_modules[\\/](?:@hookform|react-hook-form|zod)(?:[\\/]|$)/, priority: 2 },
            { name: 'ui-vendor', test: /node_modules[\\/](?:@radix-ui|@react-oauth|class-variance-authority|clsx|lucide-react|tailwind-merge)(?:[\\/]|$)/, priority: 1 },
          ],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
      '/auth': 'http://localhost:8080',
      '/health': 'http://localhost:8080',
    },
  },
})
