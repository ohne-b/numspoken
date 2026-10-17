import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/numspoken/',
  plugins: [react(), tailwindcss()],
  build: {
    // Failed modulepreloads can survive reload in WebKit: https://bugs.webkit.org/show_bug.cgi?id=270357
    modulePreload: false,
    license: { fileName: 'licenses/dependencies.md' },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    restoreMocks: true,
  },
});
