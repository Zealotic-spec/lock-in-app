import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    base: './',
    // Prevent Vite from clearing the terminal so Rust and Tauri diagnostic lines remain visible
    clearScreen: false,

    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Tauri expects a predictable dev port, strict port 3000 maintains standard container binding
      port: 3000,
      strictPort: true,
      
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      
      // Ignore src-tauri directories to prevent infinite loops in hot-reloading file watch lists
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ["**/src-tauri/**"],
      },
    },

    // Expose environment variables prefixed with VITE_ or TAURI_
    envPrefix: ['VITE_', 'TAURI_'],

    // Build configuration optimized for Tauri's responsive desktop WebViews
    build: {
      // Support modern ES features for reliable desktop WebView runtimes
      target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
      // Minify builds except during Tauri debugging
      minify: !process.env.TAURI_ENV_DEBUG,
      sourcemap: !!process.env.TAURI_ENV_DEBUG,
    },
  };
});
