import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://localhost:5000';

export default defineConfig({{
  testDir: './',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  retries: process.env.CI? 2: 0,
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results.json' }]
  ],
  use: {
    baseURL: hasTrailingSlash(baseURL),
    trace: 'playon-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
}});

function hasTrailingSlash(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}
