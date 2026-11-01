import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174 --strictPort',
    url: 'http://127.0.0.1:5174/',
    reuseExistingServer: false,
    env: {
      VITE_GOOGLE_API_KEY: 'e2e-api-key',
      VITE_GOOGLE_CALENDAR_API_KEY: '',
      VITE_GOOGLE_CALENDAR_ID: 'e2e-calendar',
      VITE_GOOGLE_DRIVE_GALLERY_FOLDER_ID: 'e2e-gallery',
      VITE_GOOGLE_FREQUENCY_SHEET_ID: '',
      VITE_GOOGLE_SONGS_SHEET_ID: '',
      VITE_EVENT_PROGRESS_WINDOW_DAYS: '7',
    },
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:5174',
    colorScheme: 'light',
    locale: 'en-US',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 360, height: 740 },
      },
    },
  ],
})
