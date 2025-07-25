import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { util } from 'chai'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      process: 'process/browser',
      stream: 'stream-browserify',
      zlib: 'browserify-zlib',
      util: 'util',
    },
  },
  server: {
    open: true,
  },
})
