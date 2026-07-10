import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 5 · React 18. Static build → dist/ for Cloudflare Pages.
export default defineConfig({
  plugins: [react()],
})
