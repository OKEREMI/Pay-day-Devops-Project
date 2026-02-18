import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
        "/api/auth": {
            target: "http://localhost:4001",
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/auth/, ""),
        },
        "/api/payment": {
            target: "http://localhost:4002",
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/payment/, ""),
        },
        },
    },
})
