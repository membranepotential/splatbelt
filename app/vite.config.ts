import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [sveltekit()],
  ssr: {
    noExternal: ['three', '@mkkellogg/gaussian-splats-3d'],
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
  },
  optimizeDeps: {
    include: ['three', '@mkkellogg/gaussian-splats-3d', 'simplify-js'],
  },
})
