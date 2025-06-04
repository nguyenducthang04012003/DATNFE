import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),  
  ],
  server: {
    allowedHosts: ['0e2a-116-110-123-21.ngrok-free.app'], // Cho phép mọi domain từ ngrok-free.app
  }
})
