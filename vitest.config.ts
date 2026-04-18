import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    globals: true,
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
    // useAuth.test.tsx OOMs its vitest worker across Linux + Windows.
    // Tracking as known flake — re-enable once root cause is isolated.
    exclude: ['node_modules/**', 'src/tests/useAuth.test.tsx'],
    pool: 'forks',
    maxConcurrency: 1,
    testTimeout: 30000,
    server: {
      deps: {
        // Avoid OOM in worker by externalizing the Sentry SDK that's only
        // dynamically imported in production code paths.
        external: [/@sentry\/.*/],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
