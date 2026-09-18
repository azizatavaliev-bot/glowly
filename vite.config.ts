import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// на GitHub Pages сайт живёт в подпапке репозитория
export default defineConfig({
  base: process.env.GH_PAGES ? '/korshop-catalog/' : '/',
  plugins: [react()],
  server: { port: 5280, host: true },
})
