import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

// @ts-ignore
import { base64 } from './node_modules/gaussian-splats-3d/util/import-base-64.js'

export default defineConfig({
  plugins: [base64({ include: '**/*.wasm' }), sveltekit()],
  assetsInclude: ['**/*.wasm'],
  ssr: {
    noExternal: ['three', 'gaussian-splats-3d'],
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
  },
  optimizeDeps: {
    include: ['three', 'gaussian-splats-3d', 'simplify-js'],
  },
})
