import { defineConfig, devices } from '@playwright/test';

// Uses the locally installed Microsoft Edge by default (no browser download needed).
// Override with PW_CHANNEL=chrome, or PW_CHANNEL=chromium after `npx playwright install chromium`.
const channel = process.env.PW_CHANNEL || 'msedge';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  expect: { timeout: 5_000 },
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'unit',
      testMatch: 'unit/**/*.spec.ts',
    },
    {
      name: 'e2e-desktop',
      testMatch: 'e2e/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], channel },
    },
    {
      name: 'e2e-mobile',
      testMatch: 'e2e/booking-flow.spec.ts',
      use: { ...devices['Pixel 7'], channel },
    },
  ],
});
