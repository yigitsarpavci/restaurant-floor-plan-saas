import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 3100);

// End-to-end smoke tests against a production build (`npm run build` first) and a seeded database
// (`npx prisma db push && npm run seed`). See README > Testing.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // `next start` runs in production mode, which refuses to sign sessions without a secret.
    env: { SESSION_SECRET: process.env.SESSION_SECRET ?? 'e2e-only-session-secret-not-for-production' },
  },
});
