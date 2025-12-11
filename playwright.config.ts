import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const isCI = !!process.env.CI;
const isPlaywrightCLI = process.argv.some((arg) => arg.includes('playwright'));
const defaultBaseURL = 'http://localhost:8081';
const envBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = envBaseURL ?? defaultBaseURL;

if (!envBaseURL && isPlaywrightCLI) {
  // Inform rather than fail; fall back to defaultBaseURL.
  console.warn(
    'PLAYWRIGHT_BASE_URL is not set. Using default http://localhost:8081. Set it in .env to silence this warning.',
  );
}

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  retries: isCI ? 2 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  outputDir: path.join(__dirname, 'tests/.playwright-output'),
  use: {
    baseURL: baseURL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});

