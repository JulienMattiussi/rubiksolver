import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:6661',
    locale: 'fr-FR',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', testDir: './tests/e2e', use: { ...devices['Desktop Chrome'] } },
    // The share preview and the README's images (`make branding` only): they
    // overwrite files of the repository, so no plain test run includes them.
    ...(process.env.BRANDING
      ? [{ name: 'branding', testDir: './tests/branding', use: { ...devices['Desktop Chrome'] } }]
      : []),
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:6661',
    reuseExistingServer: !process.env.CI,
  },
})
