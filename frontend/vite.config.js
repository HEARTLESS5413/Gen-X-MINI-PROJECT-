import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
    plugins: [react()],
    build: {
        // Optimize chunk splitting
        rollupOptions: {
            output: {
                manualChunks: {
                    // Vendor chunk — shared across all pages
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    // Supabase in its own chunk
                    supabase: ['@supabase/supabase-js'],
                    // Icons in own chunk
                    icons: ['lucide-react'],
                },
            },
        },
        // Increase warning limit (CSS is large but fine)
        chunkSizeWarningLimit: 200,
        // Better minification
        minify: 'esbuild',
        // CSS code splitting
        cssCodeSplit: true,
    },
})
